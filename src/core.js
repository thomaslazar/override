// Override rules. Pure: no DOM, no storage. Everything random is seeded.

/* ---------- random ---------- */
export function mulberry32(a){
  return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 };
}
export function hash(...xs){
  let h = 2166136261;
  for (const x of xs) { h ^= x | 0; h = Math.imul(h, 16777619); h ^= h >>> 13 }
  return h >>> 0;
}
export const rngFor = (...xs) => mulberry32(hash(...xs));

/* ---------- board helpers ---------- */
export const TYPES = 7;   // glyph and colour slots; a level uses k of them
export const DROP_KINDS = 3;   // drop tile kinds (spec, Drop tiles and the drop goal)
const range = (a, b) => Array.from({ length: b - a }, (_, k) => a + k);
export const rc = (S, i) => [Math.floor(i / S.n), i % S.n];
export const at = (S, r, c) => r >= 0 && c >= 0 && r < S.n && c < S.n ? r * S.n + c : -1;
export const nbrs = (S, i) => { const [r, c] = rc(S, i); return [at(S, r - 1, c), at(S, r + 1, c), at(S, r, c - 1), at(S, r, c + 1)].filter(j => j >= 0) };
export const tile = (S, t, s = null) => ({ id: S.ids++, t, s, lock: false });
// Static cells (S.cell: 0 live, 1 hole, 2 block; absent: all live). A dead cell never holds a tile.
export const dead = (S, i) => !!S.cell?.[i];
// The cell gravity pulls from, or -1. Without marked spawners (S.spawn) tiles fall straight through holes
// (not blocks); with them a hole separates regions, each fed by its own spawners or teleporters. Teleporters
// (S.tp: [[ingress, egress]]) link the bottom of the ingress to the top of the egress: the egress pulls from
// the ingress, the cell below an ingress from nothing.
export function above(S, i){
  const p = S.tp?.find(x => x[1] === i);
  if (p) return p[0];
  let j = i - S.n;
  while (!S.spawn && j >= 0 && S.cell?.[j] === 1) j -= S.n;
  return j < 0 || S.tp?.some(x => x[0] === j) ? -1 : j;
}
// The spawner at i ({ i, d }) or null. Without S.spawn every live cell with only holes above it (the top of
// its column) spawns any kind.
const colTop = (S, i) => { let j = i - S.n; while (j >= 0 && S.cell?.[j] === 1) j -= S.n; return j < 0 };
export const isSpawner = (S, i) => S.spawn ? S.spawn.find(x => x.i === i) ?? null
  : !dead(S, i) && colTop(S, i) ? { i, d: -1 } : null;
export const movable = (S, i) => { const x = S.grid[i]; return !!x && !x.lock };
// A drop tile ({ t: -1, s: null, d }) never matches, is never cleared and leaves at a drop point (S.exit).
export const isDrop = x => x?.d !== undefined;
export const dropTile = (S, d) => ({ ...tile(S, -1), d });
// The colour a cell matches with, or -1 (empty, encrypted, outside, zero-day, drop).
export const colourAt = (S, r, c) => { const i = at(S, r, c), x = i < 0 ? null : S.grid[i]; return x && x.s !== 'z' ? x.t : -1 };

/* ---------- matching ---------- */
// The 2 x 2 block with top-left (r, c) is all colour t (t >= 0).
const squareAt = (S, r, c, t) => t >= 0 && colourAt(S, r, c) === t && colourAt(S, r, c + 1) === t && colourAt(S, r + 1, c) === t && colourAt(S, r + 1, c + 1) === t;
export function findGroups(S){
  const { n } = S, runs = [], col = S.grid.map(x => x && x.s !== 'z' ? x.t : -1);   // colourAt, read once per cell
  for (let r = 0; r < n; r++) for (let c = 0; c < n;) {
    const t = col[r * n + c]; let e = c + 1;
    while (t >= 0 && e < n && col[r * n + e] === t) e++;
    if (t >= 0 && e - c >= 3) runs.push({ h: true, cells: range(c, e).map(x => r * n + x) });
    c = e;
  }
  for (let c = 0; c < n; c++) for (let r = 0; r < n;) {
    const t = col[r * n + c]; let e = r + 1;
    while (t >= 0 && e < n && col[e * n + c] === t) e++;
    if (t >= 0 && e - r >= 3) runs.push({ h: false, cells: range(r, e).map(x => x * n + c) });
    r = e;
  }
  // 2 x 2 squares of one colour (a 2 x 3 block is two squares, merged below)
  for (let r = 0; r < n - 1; r++) for (let c = 0; c < n - 1; c++) {
    const i = r * n + c, t = col[i];
    if (t >= 0 && col[i + 1] === t && col[i + n] === t && col[i + n + 1] === t) runs.push({ sq: true, cells: [i, i + 1, i + n, i + n + 1] });
  }
  // runs that share a cell form one group
  const owner = new Map(), groups = [];
  for (const run of runs) {
    let g = null;
    for (const i of run.cells) {
      const o = owner.get(i);
      if (!o || o === g) continue;
      if (!g) { g = o; continue }
      for (const x of o.runs) g.runs.push(x);
      for (const j of o.cells) { g.cells.add(j); owner.set(j, g) }
      o.dead = true;
    }
    if (!g) groups.push(g = { runs: [], cells: new Set() });
    g.runs.push(run);
    for (const i of run.cells) { g.cells.add(i); owner.set(i, g) }
  }
  return groups.filter(g => !g.dead);
}
// The special a group makes, from its lines first (zero-day, bomb, worm), else a rocket for a square.
// `swipe` ('h' | 'v') is set when the group came from the player's swap.
export function specialOf(g, swipe){
  const lines = g.runs.filter(x => !x.sq), max = Math.max(...lines.map(x => x.cells.length));
  if (max >= 5) return 'z';
  if (lines.some(x => x.h) && lines.some(x => !x.h)) return 'b';
  if (max === 4) return swipe || (lines.find(x => x.cells.length === 4).h ? 'h' : 'v');
  return g.runs.some(x => x.sq) ? 'r' : null;
}
// Where the special goes: a swapped cell in the group, else the crossing (bomb), else the square's top-left
// (rocket), else the middle of the longest line.
export function spotOf(g, s, prefer = []){
  for (const i of prefer) if (g.cells.has(i)) return i;
  if (s === 'r') return g.runs.find(x => x.sq).cells[0];
  const lines = g.runs.filter(x => !x.sq);
  if (s === 'b') {
    const hs = new Set(lines.filter(x => x.h).flatMap(x => x.cells));
    for (const x of lines) if (!x.h) for (const i of x.cells) if (hs.has(i)) return i;
  }
  const L = lines.reduce((a, b) => b.cells.length > a.cells.length ? b : a);
  return L.cells[L.cells.length >> 1];
}
export function lineAt(S, i){
  const [r, c] = rc(S, i), t = colourAt(S, r, c);
  if (t < 0) return false;
  let h = 1, v = 1;
  for (let k = c - 1; colourAt(S, r, k) === t; k--) h++;
  for (let k = c + 1; colourAt(S, r, k) === t; k++) h++;
  for (let k = r - 1; colourAt(S, k, c) === t; k--) v++;
  for (let k = r + 1; colourAt(S, k, c) === t; k++) v++;
  return h >= 3 || v >= 3 || [[0, 0], [0, 1], [1, 0], [1, 1]].some(([a, b]) => squareAt(S, r - a, c - b, t));
}
export function swapLegal(S, a, b){
  if (!movable(S, a) || !movable(S, b)) return false;
  const A = S.grid[a], B = S.grid[b], dA = isDrop(A), dB = isDrop(B);
  if (dA && dB) return false;
  // a worm or bomb swapped with a drop fires; a zero-day has no colour to take from a drop
  if (dA || dB) { if ((dA ? B : A).s && (dA ? B : A).s !== 'z') return true }
  else if (A.s || B.s) return true;
  S.grid[a] = B; S.grid[b] = A;
  // with a drop only the other tile counts (a special too: it must land in a match)
  const ok = dA ? lineAt(S, a) : dB ? lineAt(S, b) : lineAt(S, a) || lineAt(S, b);
  S.grid[a] = A; S.grid[b] = B;
  return ok;
}
export function validMoves(S){
  const out = [];
  for (let i = 0; i < S.n * S.n; i++) {
    const [r, c] = rc(S, i);
    for (const j of [at(S, r, c + 1), at(S, r + 1, c)]) if (j >= 0 && swapLegal(S, i, j)) out.push([i, j]);
  }
  return out;
}
export function hasMove(S){
  for (let i = 0; i < S.n * S.n; i++) {
    const [r, c] = rc(S, i);
    for (const j of [at(S, r, c + 1), at(S, r + 1, c)]) if (j >= 0 && swapLegal(S, i, j)) return true;
  }
  return false;
}

/* ---------- refill ---------- */
// Helpful refill (spec, Fairness): weights only ever add to 1, never against the player.
export const REFILL = { A: 1.5, B: 0.5, M: 2 };
// Chance that a free match made by refilled tiles survives (the rest are recoloured once the board settles).
export const DAMP = 0.2;
// 0 while goal progress keeps pace with moves used, up to 1 when far behind. 0 without a limit (bot).
export function pressure(S){
  if (!S.limit) return 0;
  let need = 0, got = 0;
  for (const g of S.goals) { need += g.need; got += Math.min(g.got, g.need) }
  const used = (S.limit - S.moves) / S.limit, progress = need ? got / need : 1;
  return Math.max(0, Math.min(1, (used - progress) * 2));
}
// Colour t at cell i makes a near pair (same colour next to it, or one cell further in a line),
// but not a direct match: free cascades get no help.
export function setsUp(S, i, t){
  const old = S.grid[i];
  S.grid[i] = { t, s: null };
  const [r, c] = rc(S, i);
  let ok = false;
  if (!lineAt(S, i)) for (const [dr, dc] of [[0, 1], [1, 0], [0, -1], [-1, 0]])
    if (colourAt(S, r + dr, c + dc) === t || colourAt(S, r + 2 * dr, c + 2 * dc) === t) { ok = true; break }
  S.grid[i] = old;
  return ok;
}
export function refillWeights(S, i){
  const w = Array(S.k).fill(1);
  if (!S.nice) return w;
  const p = pressure(S);
  for (let t = 0; t < S.k; t++) {
    if (setsUp(S, i, t)) w[t] += REFILL.A + REFILL.M * p;
    if (S.goals.some(g => g.kind === 'tiles' && g.t === t && g.got < g.need)) w[t] += REFILL.B;
  }
  return w;
}
export function spawnColour(S, i){
  const w = refillWeights(S, i);
  let x = rngFor(S.seed, 7, S.spawns++)() * w.reduce((a, b) => a + b, 0);
  for (let t = 0; t < w.length; t++) if ((x -= w[t]) < 0) return t;
  return w.length - 1;
}

// Fills every free cell without a match, retrying until a move exists. Encrypted cells stay empty.
export function fillBoard(S, rnd){
  do {
    for (let i = 0; i < S.n * S.n; i++) {
      S.grid[i] = null;
      if (S.enc[i] || dead(S, i)) continue;
      const [r, c] = rc(S, i);
      let t;
      do t = Math.floor(rnd() * S.k);
      while ((colourAt(S, r, c - 1) === t && colourAt(S, r, c - 2) === t) || (colourAt(S, r - 1, c) === t && colourAt(S, r - 2, c) === t)
        || (colourAt(S, r - 1, c - 1) === t && colourAt(S, r - 1, c) === t && colourAt(S, r, c - 1) === t));
      S.grid[i] = tile(S, t);
    }
  } while (!hasMove(S));
}

/* ---------- clearing ---------- */
// A random colour still on the board (seeded by the zero-day's id), for a zero-day fired by a blast.
function randomColour(S, id){
  const on = [...new Set(S.grid.filter(x => x && x.s !== 'z' && !isDrop(x)).map(x => x.t))].sort((a, b) => a - b);
  return on[Math.floor(rngFor(S.seed, 13, id)() * on.length)];
}
function square(S, i, d){
  const [r, c] = rc(S, i), out = [];
  for (let a = r - d; a <= r + d; a++) for (let b = c - d; b <= c + d; b++) { const j = at(S, a, b); if (j >= 0) out.push(j) }
  return out;
}
// Up to `count` distinct cells a rocket fired from `from` hits, by tier: firewalled tiles, encrypted cells, tiles a
// tile goal still needs, the tile under a drop, any other tile. Never a dead cell, a drop, `from` or a cell in `exclude`.
export function rocketTargets(S, from, count, exclude){
  const tiers = [[], [], [], [], []];
  for (let i = 0; i < S.n * S.n; i++) {
    const x = S.grid[i];
    if (i === from || exclude.has(i) || dead(S, i) || isDrop(x) || !(x || S.enc[i])) continue;
    tiers[x?.lock ? 0 : S.enc[i] ? 1 : x.s !== 'z' && S.goals.some(g => g.kind === 'tiles' && g.t === x.t && g.got < g.need) ? 2
      : isDrop(S.grid[i - S.n]) ? 3 : 4].push(i);
  }
  const out = [];
  for (const tier of tiers) while (tier.length && out.length < count)
    out.push(tier.splice(Math.floor(rngFor(S.seed, 19, S.spawns, from, out.length)() * tier.length), 1)[0]);
  return out;
}
// Cells a fired special clears; `cells` is the wave's set so far (rocket targets skip it).
function area(S, i, x, cells){
  const [r, c] = rc(S, i), n = S.n;
  if (x.s === 'h') return range(0, n).map(k => r * n + k);
  if (x.s === 'v') return range(0, n).map(k => k * n + c);
  if (x.s === 'b') return square(S, i, 1);
  if (x.s === 'r') return rocketTargets(S, i, 3, cells);
  const t = x.target ?? randomColour(S, x.id);   // zero-day: the swapped tile's colour, else a random one
  return range(0, n * n).filter(j => S.grid[j] && S.grid[j].s !== 'z' && S.grid[j].t === t);
}
export const SCORE = { exit: 200, tile: 10, crack: 20, unlock: 30, create: 50, fire: 50, zero: 100, chainCap: 5 };
export function pointsOf(step, chain){
  const zeros = step.fired.filter(f => f.s === 'z').length;
  return Math.min(chain, SCORE.chainCap) * (SCORE.tile * step.cleared.length + SCORE.crack * step.cracked.length
    + SCORE.unlock * step.unlocked.length + SCORE.create * step.created.length
    + SCORE.fire * (step.fired.length - zeros) + SCORE.zero * zeros);
}
// `t`: the colour for 'tiles', the drop kind for 'drop'.
function bump(S, kind, t){ for (const g of S.goals) if (g.kind === kind && (kind === 'tiles' ? g.t === t : kind !== 'drop' || g.d === t)) g.got++ }
// One wave: fire specials in `cells` (chains), hit blockers, clear tiles, then place new specials.
// `matched` holds cells cleared by matching (they crack encrypted neighbours); `fired` holds ids that must not fire.
function wave(S, cells, matched, creates, fired = new Set(), chain = 1){
  const step = { k: 'wave', fired: [], cleared: [], cracked: [], unlocked: [], created: [] };
  const queue = [...cells], near = new Set(matched);   // near: cleared like a match, so they crack their neighbours
  while (queue.length) {
    const i = queue.pop(), x = S.grid[i];
    if (!x || !x.s || fired.has(x.id)) continue;
    fired.add(x.id); step.fired.push({ i, s: x.s });
    const a = area(S, i, x, cells);
    if (x.s === 'r') (step.rockets ??= []).push(...a.map(to => ({ from: i, to })));   // flights, for the UI
    if (x.s === 'z') a.forEach(j => near.add(j));   // a zero-day's tiles count as matched
    for (const j of a) if (!cells.has(j)) { cells.add(j); queue.push(j) }
  }
  const hit = new Set();
  for (const i of cells) if (S.enc[i]) hit.add(i);
  for (const i of near) for (const j of nbrs(S, i)) if (S.enc[j]) hit.add(j);
  for (const i of hit) { S.enc[i]--; step.cracked.push({ i, hp: S.enc[i] }); if (!S.enc[i]) bump(S, 'crack') }
  for (const i of cells) {
    const x = S.grid[i];
    if (!x || isDrop(x)) continue;   // blasts pass drops by
    if (x.lock) { x.lock = false; step.unlocked.push(i); bump(S, 'firewall'); continue }
    if (x.s !== 'z') bump(S, 'tiles', x.t);
    step.cleared.push({ i, id: x.id }); S.grid[i] = null;
  }
  for (const c of creates) {
    const old = S.grid[c.i];   // an unlocked firewalled tile can still sit here: consume it like a matched one
    if (old) { if (old.s !== 'z') bump(S, 'tiles', old.t); step.cleared.push({ i: c.i, id: old.id }) }
    const x = tile(S, c.t, c.s); S.grid[c.i] = x; step.created.push({ i: c.i, tile: { ...x } });
  }
  step.points = pointsOf(step, chain); S.score = (S.score ?? 0) + step.points;
  step.got = S.goals.map(g => g.got);   // goal progress after this wave, so the HUD can tick along
  return step;
}

/* ---------- gravity ---------- */
const occupied = (S, i) => S.grid[i] || S.enc[i] || dead(S, i) ? 1 : 0;
function shift(S, from, to, step){ const x = S.grid[from]; S.grid[to] = x; S.grid[from] = null; step.moves.push({ id: x.id, from, to }) }
// Passes until stable: straight down from `above`, else spawn at a spawner, else diagonal fill for unfed cells.
// Roofed pockets stay empty; dead cells never fill.
export function gravity(S, steps, calm = false){
  // cached per settle: what a cell pulls from, whether it spawns and whether it is fed stay fixed while
  // tiles fall (dead, encrypted and firewalled cells do not change during gravity)
  const n = S.n, spawned = [], up = [], spawns = [], reach = [];
  // A cell i is fed when going up from above(i), following teleporters up, meets a spawner before anything
  // fixed (dead cell, encrypted cell, firewalled tile). A cell is marked unfed while its own walk runs,
  // so a teleporter loop (which never reaches a spawner) counts as unfed.
  const reaches = j => {
    if (j < 0) return false;
    if (reach[j] !== undefined) return reach[j];
    reach[j] = false;
    return reach[j] = !(dead(S, j) || S.enc[j] || S.grid[j]?.lock) && ((spawns[j] ??= !!isSpawner(S, j)) || reaches(up[j] ??= above(S, j)));
  };
  // whether walking up from j (straight and through teleporters) meets i
  const downstream = (i, j) => { for (let k = 0; k < n * n && j >= 0; k++) if ((j = up[j] ??= above(S, j)) === i) return true; return false };
  // ponytail: pass cap only stops a teleporter loop (layouts.check rejects those) from cycling a gap forever
  for (let pass = 0; pass < 8 * n * n; pass++) {
    const step = { k: 'fall', moves: [], spawns: [] };
    for (let r = n - 1; r >= 0; r--) for (let c = 0; c < n; c++) {
      const i = r * n + c;
      if (S.grid[i] || S.enc[i] || dead(S, i)) continue;
      const a = up[i] ??= above(S, i);
      if (a >= 0 && movable(S, a)) { shift(S, a, i, step); continue }
      if (spawns[i] ??= !!isSpawner(S, i)) {
        const d = dropDue(S, i), x = d >= 0 ? dropTile(S, d) : tile(S, spawnColour(S, i));
        S.grid[i] = x; step.spawns.push({ i, tile: { ...x } });
        if (d < 0) spawned.push([x, step.spawns[step.spawns.length - 1]]);
        continue;
      }
      if (r === 0 || reaches(a)) continue;
      // prefer a tile that cannot fall straight itself; never take from a cell fed (through a teleporter)
      // from this cell's own column, or the same tiles would cycle between the two columns forever
      const ds = [c - 1, c + 1].filter(cc => cc >= 0 && cc < n && movable(S, (r - 1) * n + cc) && !downstream(i, (r - 1) * n + cc))
        .sort((a, b) => occupied(S, r * n + b) - occupied(S, r * n + a) || (pass + r) % 2 * 2 - 1);   // ties: sides alternate
      if (ds.length) shift(S, (r - 1) * n + ds[0], i, step);
    }
    if (!step.moves.length && !step.spawns.length) {
      if (!calm && exits(S, steps)) continue;   // a drop swapped onto a drop point leaves too, then its cell refills
      return calm ? undefined : damp(S, spawned);
    }
    steps.push(step);
    if (!calm) exits(S, steps);   // a drop leaves as soon as it lands on a drop point
  }
  return calm ? undefined : damp(S, spawned);
}

// The drop kind spawner i spawns now, or -1. Due every S.drops.every moves (S.drops.wait counts them), or with
// every 0 once no drop is on the board; only a kind the spawner allows and the goals still need beyond the drops on the board.
// The drop lands on one of the empty spawners that allow its kind, evenly: each in turn takes it with chance
// 1 / (those still empty), so a row-clearing worm does not always hand it to the leftmost spawner.
function dropDue(S, i){
  if (!S.drops) return -1;
  const on = S.grid.filter(isDrop);
  if (S.drops.every ? S.drops.wait < S.drops.every : on.length) return -1;
  const { d } = isSpawner(S, i);
  for (const g of S.goals) if (g.kind === 'drop' && (d < 0 || d === g.d) && g.got + on.filter(x => x.d === g.d).length < g.need) {
    let free = 0;
    for (let j = 0; j < S.n * S.n; j++) { const sp = !S.grid[j] && isSpawner(S, j); if (sp && (sp.d < 0 || sp.d === g.d)) free++ }
    if (free > 1 && rngFor(S.seed, 17, S.spawns, i)() * free >= 1) return -1;
    S.drops.wait = 0;
    return g.d;
  }
  return -1;
}
// Drops on drop points leave the board: one 'exit' step each, the goal counts, flat SCORE.exit (no chain factor).
function exits(S, steps){
  let out = false;
  for (const i of S.exit ?? []) {
    const x = S.grid[i];
    if (!isDrop(x)) continue;
    S.grid[i] = null; bump(S, 'drop', x.d); S.score = (S.score ?? 0) + SCORE.exit; out = true;
    steps.push({ k: 'exit', i, id: x.id, d: x.d, points: SCORE.exit, got: S.goals.map(g => g.got) });
  }
  return out;
}
// Settled board: a refilled plain tile that sits in a line survives with chance DAMP, else it takes a
// colour that makes no line. The spawn record is patched so the animation shows the final colour.
function damp(S, spawned){
  for (const [x, rec] of spawned) {
    const j = S.grid.indexOf(x);
    if (j < 0 || x.s || !lineAt(S, j)) continue;
    const rnd = rngFor(S.seed, 9, S.spawns, j);
    if (rnd() < DAMP) continue;
    const ok = [];
    for (let t = 0; t < S.k; t++) { x.t = t; if (!lineAt(S, j)) ok.push(t) }
    if (ok.length) x.t = ok[Math.floor(rnd() * ok.length)];
    else x.t = rec.tile.t;
    rec.tile.t = x.t;
  }
}

/* ---------- moves ---------- */
export const nextTo = (S, a, b) => { const [r1, c1] = rc(S, a), [r2, c2] = rc(S, b); return Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1 };
export const won = S => S.goals.every(g => g.got >= g.need);
export const lost = S => !won(S) && S.moves <= 0;

// `fire` holds cells that join the first wave even without a match (a swapped special).
function cascade(S, steps, prefer = [], swipe = null, fire = [], chain = 1, calm = false){
  for (;;) {
    const gs = findGroups(S);
    if (!gs.length) return;
    const cells = new Set(fire), matched = new Set(), creates = [];
    for (const g of gs) {
      for (const i of g.cells) { cells.add(i); matched.add(i) }
      const s = specialOf(g, swipe);
      if (s) { const i = spotOf(g, s, prefer); creates.push({ i, s, t: s === 'z' ? -1 : S.grid[i].t }) }
    }
    steps.push(wave(S, cells, matched, creates, new Set(), chain++));
    gravity(S, steps, calm);
    prefer = []; swipe = null; fire = [];
  }
}
/* ---------- finale ---------- */
export const FINALE_BATCH = 5;   // spare moves turned special and fired together per round
// After a win: fire every special left, then turn spare moves into random specials, up to FINALE_BATCH at a time, and fire them.
// Refills are not damped (calm), so lucky lines are allowed. Precondition: won(S).
export function finale(S){
  const spare = S.moves; S.spare = spare; S.moves = 0;
  const steps = [{ k: 'finale' }];
  const burst = () => {
    for (let n = 0; n < 500; n++) {   // cap: a pathological board cannot loop forever
      const cells = new Set(); S.grid.forEach((x, i) => { if (x && x.s) cells.add(i) });
      if (!cells.size) return;
      steps.push(wave(S, cells, new Set(), [], new Set(), 1)); gravity(S, steps, true);
      cascade(S, steps, [], null, [], 2, true);
    }
  };
  burst();
  // Spare moves go in rounds of up to FINALE_BATCH: that many tiles turn special at once, then fire together.
  for (let k = 0, left = spare; left > 0; k++) {
    const rnd = rngFor(S.seed, 29, k), n = Math.min(FINALE_BATCH, left); left -= n;
    const plain = []; S.grid.forEach((x, i) => { if (x && !x.lock && !x.s && !isDrop(x)) plain.push(i) });
    const cells = [];
    while (cells.length < n && plain.length) {
      const i = plain.splice(Math.floor(rnd() * plain.length), 1)[0], s = rnd() < 1 / 3 ? 'b' : rnd() < .5 ? 'h' : 'v';
      S.grid[i].s = s; cells.push({ i, s });
    }
    steps.push({ k: 'convert', cells, spent: n });
    burst();
  }
  return { steps };
}
// A swap with at least one special. A is the dragged tile (now at pa), B the other (now at pb).
function combo(S, A, pa, B, pb, steps){
  const cells = new Set(), fired = new Set(), [r, c] = rc(S, pa), n = S.n, flights = [];
  if (!A.s || !B.s) {
    const [sp, p, other, q] = A.s ? [A, pa, B, pb] : [B, pb, A, pa];
    cells.add(p);
    if (sp.s === 'z') { sp.target = other.t; cells.add(q) }
  } else {
    cells.add(pa); cells.add(pb);
    const z = A.s === 'z' ? A : B.s === 'z' ? B : null, o = z === A ? B : A;
    if (z && o.s === 'z') { fired.add(A.id); fired.add(B.id); range(0, n * n).forEach(i => cells.add(i)); steps.push({ k: 'combo', i: pa, kind: 'zz' }) }
    else if (z) {
      fired.add(z.id);
      const rnd = rngFor(S.seed, 11, S.spawns), conv = [];
      for (let i = 0; i < n * n; i++) {
        const y = S.grid[i];
        if (!y || y.s === 'z' || y.t !== o.t) continue;
        if (!y.s) { y.s = o.s === 'b' || o.s === 'r' ? o.s : rnd() < .5 ? 'h' : 'v'; conv.push({ i, s: y.s }) }
        cells.add(i);
      }
      steps.push({ k: 'combo', i: pa, kind: o.s === 'b' ? 'zb' : o.s === 'r' ? 'zr' : 'zw' }, { k: 'convert', cells: conv });
    } else {
      fired.add(A.id); fired.add(B.id);
      // 'ww', 'bw', 'bb', or a rocket first: 'rr', 'rw', 'rb'
      const ks = [A.s, B.s].map(s => s === 'h' || s === 'v' ? 'w' : s), kind = ks.includes('r') ? 'r' + ks[ks[0] === 'r' ? 1 : 0] : ks.sort().join('');
      if (kind[0] === 'r') for (const to of rocketTargets(S, pa, kind === 'rr' ? 8 : 3, cells)) {   // rockets fly; a worm or bomb goes off at each target
        flights.push({ from: pa, to }); cells.add(to);
        if (kind !== 'rr') area(S, to, { s: kind === 'rb' ? 'b' : rngFor(S.seed, 19, S.spawns, to)() < .5 ? 'h' : 'v' }, cells).forEach(j => cells.add(j));
      }
      if (kind === 'ww') for (let k = 0; k < n; k++) { cells.add(r * n + k); cells.add(k * n + c) }
      if (kind === 'bw') for (let d = -1; d <= 1; d++) for (let k = 0; k < n; k++) {
        if (r + d >= 0 && r + d < n) cells.add((r + d) * n + k);
        if (c + d >= 0 && c + d < n) cells.add(k * n + c + d);
      }
      if (kind === 'bb') square(S, pa, 2).forEach(i => cells.add(i));
      steps.push({ k: 'combo', i: pa, kind });
    }
  }
  const w = wave(S, cells, new Set(), [], fired);
  if (flights.length) w.rockets = [...flights, ...w.rockets ?? []];
  steps.push(w);
  gravity(S, steps);
}
// A move is spent: one fewer left, one more towards the next scheduled drop.
const spend = S => { S.moves--; if (S.drops) S.drops.wait++ };
// A worm, bomb or rocket fired in place (a double tap): costs a move like a swap. Zero-days need a swap.
function tap(S, i){
  const steps = [], x = S.grid[i];
  if (!x || x.lock || !x.s || x.s === 'z') return { ok: false, steps };
  spend(S); steps.push(wave(S, new Set([i]), new Set(), [])); gravity(S, steps); cascade(S, steps, [], null, [], 2);
  return { ok: true, steps };
}
// The player drags the tile at `a` onto `b` (a === b fires the special at a). Resolves everything; returns the steps for the UI.
export function move(S, a, b){
  const steps = [];
  if (a === b && S.moves > 0 && !won(S)) {
    const r = tap(S, a);
    if (r.ok && !won(S) && S.moves > 0 && !hasMove(S)) reshuffle(S, r.steps);
    return r;
  }
  if (S.moves <= 0 || won(S) || !nextTo(S, a, b) || !movable(S, a) || !movable(S, b)) return { ok: false, steps };
  const A = S.grid[a], B = S.grid[b], drop = isDrop(A) || isDrop(B);
  // a swap with a drop goes only when the other tile lands in a match (then it resolves as that match, no combo)
  if (drop && !swapLegal(S, a, b)) { steps.push({ k: 'swap', a, b }, { k: 'back', a, b }); return { ok: false, steps } }
  S.grid[a] = B; S.grid[b] = A;
  steps.push({ k: 'swap', a, b });
  if (!resolve(S, A, a, B, b, steps, true)) { S.grid[a] = A; S.grid[b] = B; steps.push({ k: 'back', a, b }); return { ok: false, steps } }
  if (!won(S) && S.moves > 0 && !hasMove(S)) reshuffle(S, steps);
  return { ok: true, steps };
}
// Resolves a swap already made (A from a now at b, B at a); spends a move when `pay`. False when nothing happens.
function resolve(S, A, a, B, b, steps, pay){
  const swipe = rc(S, a)[0] === rc(S, b)[0] ? 'h' : 'v', lone = !A.s !== !B.s && A.s !== 'z' && B.s !== 'z', drop = isDrop(A) || isDrop(B);
  const go = () => { if (pay) spend(S) };
  // A lone worm or bomb swapped into a match resolves as that match (it fires in the wave, and the
  // special the match makes is placed after the clear, so it survives). Otherwise a special swap is a combo.
  if (drop && !A.s && !B.s) { go(); cascade(S, steps, [b, a], swipe) }
  else if (lone && findGroups(S).length) { go(); cascade(S, steps, [b, a], swipe, [A.s ? b : a]) }
  else if ((A.s || B.s) && !(drop && (A.s === 'z' || B.s === 'z'))) { go(); combo(S, A, b, B, a, steps); cascade(S, steps, [], null, [], 2) }   // a zero-day has no colour to take from a drop
  else if (findGroups(S).length) { go(); cascade(S, steps, [b, a], swipe) }
  else return false;
  return true;
}

/* ---------- gear and tools ---------- */
// Gear on the start screen: each special goes on a random plain tile (no special, drop, firewall or encryption),
// keeping its colour so no match appears; `moves` adds n moves. Seeded, so the same deal gets the same cells.
export function applyGear(S, gear){
  const plain = [];
  S.grid.forEach((x, i) => { if (x && !x.s && !x.lock && !isDrop(x) && !S.enc[i]) plain.push(i) });
  gear.forEach((g, k) => {
    const rnd = rngFor(S.seed, 37, k);
    if (g.id === 'moves') { S.moves += g.n; S.limit += g.n; return }
    if (!plain.length) return;
    const x = S.grid[plain.splice(Math.floor(rnd() * plain.length), 1)[0]];
    if (g.id === 'zero') { x.s = 'z'; x.t = -1 }
    else x.s = g.id === 'bomb' ? 'b' : g.id === 'rocket' ? 'r' : rnd() < .5 ? 'h' : 'v';
  });
  S.gear = gear.map(g => g.id);
}
// In-level tools: never spend a move, so they cannot lose the level; they can win it.
export function tool(S, kind, a, b){
  const steps = [], no = { ok: false, steps };
  if (S.moves <= 0 || won(S)) return no;
  if (kind === 'hammer') {
    const x = S.grid[a];
    if (!(a >= 0 && a < S.n * S.n) || dead(S, a) || (x ? isDrop(x) : !S.enc[a])) return no;
    // a one-cell wave: a firewall is only unlocked (its special does not fire), a special fires
    steps.push(wave(S, new Set([a]), new Set(), [], new Set(x?.lock ? [x.id] : [])));
    gravity(S, steps); cascade(S, steps, [], null, [], 2);
  } else if (kind === 'swap') {
    if (!nextTo(S, a, b) || !movable(S, a) || !movable(S, b)) return no;
    const A = S.grid[a], B = S.grid[b];
    S.grid[a] = B; S.grid[b] = A;
    steps.push({ k: 'swap', a, b });
    resolve(S, A, a, B, b, steps, false);   // nothing to resolve: it stays swapped
    gravity(S, steps); cascade(S, steps, [], null, [], 2);   // a drop swapped onto a drop point leaves
  } else if (kind === 'shuffle') reshuffle(S, steps);
  else return no;
  if (!won(S) && !hasMove(S)) reshuffle(S, steps);
  return { ok: true, steps };
}
// Shuffles movable tiles except drops (seeded) until no match and a valid move; after 200 tries also redraws colours.
export function reshuffle(S, steps){
  const spots = [], tiles = [];
  for (let i = 0; i < S.n * S.n; i++) if (movable(S, i) && !isDrop(S.grid[i])) { spots.push(i); tiles.push(S.grid[i]) }
  const rnd = rngFor(S.seed, 13, S.shuffles++);
  for (let k = 0; k < 400; k++) {
    if (k >= 200) for (const x of tiles) if (!x.s) x.t = Math.floor(rnd() * S.k);
    for (let j = tiles.length - 1; j > 0; j--) { const m = Math.floor(rnd() * (j + 1)); [tiles[j], tiles[m]] = [tiles[m], tiles[j]] }
    spots.forEach((i, m) => S.grid[i] = tiles[m]);
    if (!findGroups(S).length && hasMove(S)) break;
  }
  steps.push({ k: 'shuffle', tiles: spots.map(i => ({ i, id: S.grid[i].id, t: S.grid[i].t })) });
}

/* ---------- saves ---------- */
const int = (x, lo, hi) => Number.isInteger(x) && x >= lo && x <= hi;
const validTile = (x, k) => x === null || (x && typeof x === 'object' && Number.isInteger(x.id) && typeof x.lock === 'boolean'
  && (x.d !== undefined ? int(x.d, 0, DROP_KINDS - 1) && x.t === -1 && x.s === null && !x.lock
    : (x.s === 'z' && x.t === -1) || ([null, 'h', 'v', 'b', 'r'].includes(x.s) && int(x.t, 0, k - 1))));
export function validSave(o){
  if (!o || typeof o !== 'object' || o.v !== 1) return false;
  if (!int(o.level, 1, 1e6) || !int(o.fails, 0, 1e6) || !int(o.n, 5, 11) || !int(o.k, 2, TYPES)) return false;
  if (!int(o.moves, 0, 999) || !int(o.limit, 0, 999) || !int(o.seed, 0, 2 ** 32) || !int(o.ids, 0, 1e9)) return false;
  if (!int(o.spawns, 0, 1e9) || !int(o.shuffles, 0, 1e9) || typeof o.nice !== 'boolean') return false;
  if (o.score !== undefined && !int(o.score, 0, 1e9)) return false;
  if (o.spare !== undefined && !int(o.spare, 0, 999)) return false;
  if (o.gear !== undefined && !(Array.isArray(o.gear) && o.gear.every(x => ['worm', 'bomb', 'rocket', 'zero', 'moves'].includes(x)))) return false;
  if (!Array.isArray(o.types) || o.types.length < o.k || !o.types.every(x => int(x, 0, TYPES - 1))) return false;
  const w = o.w ?? o.n, h = o.h ?? o.n;   // sides: MIN_SIDE..MAX in layouts.js; missing means square
  if (!int(w, 5, o.n) || !int(h, 5, o.n) || Math.max(w, h) !== o.n) return false;
  const nn = o.n * o.n;
  if (!Array.isArray(o.grid) || o.grid.length !== nn || !o.grid.every(x => validTile(x, o.k))) return false;
  if (!Array.isArray(o.enc) || o.enc.length !== nn || !o.enc.every(x => int(x, 0, 3))) return false;
  if (o.cell !== undefined && (!Array.isArray(o.cell) || o.cell.length !== nn || !o.cell.every((x, i) => int(x, 0, 2) && (!x || (o.grid[i] === null && !o.enc[i]))))) return false;
  const liveCell = i => int(i, 0, nn - 1) && !o.cell?.[i];
  if (o.spawn !== undefined && (!Array.isArray(o.spawn) || !o.spawn.every(x => x && liveCell(x.i) && int(x.d, -1, 2))
    || new Set(o.spawn.map(x => x.i)).size !== o.spawn.length)) return false;
  // teleporters: complete pairs of live cells, no cell in two places
  if (o.tp !== undefined && (!Array.isArray(o.tp) || !o.tp.every(p => Array.isArray(p) && p.length === 2 && p.every(liveCell))
    || new Set(o.tp.flat()).size !== o.tp.length * 2)) return false;
  if (o.exit !== undefined && (!Array.isArray(o.exit) || !o.exit.every(liveCell) || new Set(o.exit).size !== o.exit.length)) return false;
  if (o.drops !== undefined && !(o.drops && int(o.drops.every, 0, 999) && int(o.drops.wait, 0, 1e9))) return false;
  if (!Array.isArray(o.goals) || !o.goals.length || o.goals.length > 3) return false;
  return o.goals.every(g => g && ['tiles', 'crack', 'firewall', 'drop'].includes(g.kind) && int(g.need, 1, 999) && int(g.got, 0, 1e9)
    && (g.kind !== 'tiles' || int(g.t, 0, o.k - 1)) && (g.kind !== 'drop' || int(g.d, 0, DROP_KINDS - 1)));
}
export const toSave = S => JSON.parse(JSON.stringify(S));
export const fromSave = o => validSave(o) ? { ...JSON.parse(JSON.stringify(o)), score: o.score ?? 0 } : null;
