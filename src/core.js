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
const range = (a, b) => Array.from({ length: b - a }, (_, k) => a + k);
export const rc = (S, i) => [Math.floor(i / S.n), i % S.n];
export const at = (S, r, c) => r >= 0 && c >= 0 && r < S.n && c < S.n ? r * S.n + c : -1;
export const nbrs = (S, i) => { const [r, c] = rc(S, i); return [at(S, r - 1, c), at(S, r + 1, c), at(S, r, c - 1), at(S, r, c + 1)].filter(j => j >= 0) };
export const tile = (S, t, s = null) => ({ id: S.ids++, t, s, lock: false });
export const movable = (S, i) => { const x = S.grid[i]; return !!x && !x.lock };
// The colour a cell matches with, or -1 (empty, encrypted, outside, zero-day).
export const colourAt = (S, r, c) => { const i = at(S, r, c), x = i < 0 ? null : S.grid[i]; return x && x.s !== 'z' ? x.t : -1 };

/* ---------- matching ---------- */
export function findGroups(S){
  const { n } = S, runs = [];
  for (let r = 0; r < n; r++) for (let c = 0; c < n;) {
    const t = colourAt(S, r, c); let e = c + 1;
    while (t >= 0 && e < n && colourAt(S, r, e) === t) e++;
    if (t >= 0 && e - c >= 3) runs.push({ h: true, cells: range(c, e).map(x => r * n + x) });
    c = e;
  }
  for (let c = 0; c < n; c++) for (let r = 0; r < n;) {
    const t = colourAt(S, r, c); let e = r + 1;
    while (t >= 0 && e < n && colourAt(S, e, c) === t) e++;
    if (t >= 0 && e - r >= 3) runs.push({ h: false, cells: range(r, e).map(x => x * n + c) });
    r = e;
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
// The special a group makes. `swipe` ('h' | 'v') is set when the group came from the player's swap.
export function specialOf(g, swipe){
  const max = Math.max(...g.runs.map(x => x.cells.length));
  if (max >= 5) return 'z';
  if (g.runs.some(x => x.h) && g.runs.some(x => !x.h)) return 'b';
  if (max === 4) return swipe || (g.runs.find(x => x.cells.length === 4).h ? 'h' : 'v');
  return null;
}
// Where the special goes: a swapped cell in the group, else the crossing (bomb), else the middle of the longest run.
export function spotOf(g, s, prefer = []){
  for (const i of prefer) if (g.cells.has(i)) return i;
  if (s === 'b') {
    const hs = new Set(g.runs.filter(x => x.h).flatMap(x => x.cells));
    for (const x of g.runs) if (!x.h) for (const i of x.cells) if (hs.has(i)) return i;
  }
  const L = g.runs.reduce((a, b) => b.cells.length > a.cells.length ? b : a);
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
  return h >= 3 || v >= 3;
}
export function swapLegal(S, a, b){
  if (!movable(S, a) || !movable(S, b)) return false;
  const A = S.grid[a], B = S.grid[b];
  if (A.s || B.s) return true;
  S.grid[a] = B; S.grid[b] = A;
  const ok = lineAt(S, a) || lineAt(S, b);
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
      if (S.enc[i]) continue;
      const [r, c] = rc(S, i);
      let t;
      do t = Math.floor(rnd() * S.k);
      while ((colourAt(S, r, c - 1) === t && colourAt(S, r, c - 2) === t) || (colourAt(S, r - 1, c) === t && colourAt(S, r - 2, c) === t));
      S.grid[i] = tile(S, t);
    }
  } while (!hasMove(S));
}

/* ---------- clearing ---------- */
function commonColour(S){
  const m = Array(S.k).fill(0);
  for (const x of S.grid) if (x && x.s !== 'z') m[x.t]++;
  return m.indexOf(Math.max(...m));
}
function square(S, i, d){
  const [r, c] = rc(S, i), out = [];
  for (let a = r - d; a <= r + d; a++) for (let b = c - d; b <= c + d; b++) { const j = at(S, a, b); if (j >= 0) out.push(j) }
  return out;
}
// Cells a fired special clears.
function area(S, i, x){
  const [r, c] = rc(S, i), n = S.n;
  if (x.s === 'h') return range(0, n).map(k => r * n + k);
  if (x.s === 'v') return range(0, n).map(k => k * n + c);
  if (x.s === 'b') return square(S, i, 1);
  const t = x.target ?? commonColour(S);   // zero-day: the swapped tile's colour, else the most common
  return range(0, n * n).filter(j => S.grid[j] && S.grid[j].s !== 'z' && S.grid[j].t === t);
}
function bump(S, kind, t){ for (const g of S.goals) if (g.kind === kind && (kind !== 'tiles' || g.t === t)) g.got++ }
// One wave: fire specials in `cells` (chains), hit blockers, clear tiles, then place new specials.
// `matched` holds cells cleared by matching (they crack encrypted neighbours); `fired` holds ids that must not fire.
function wave(S, cells, matched, creates, fired = new Set()){
  const step = { k: 'wave', fired: [], cleared: [], cracked: [], unlocked: [], created: [] };
  const queue = [...cells];
  while (queue.length) {
    const i = queue.pop(), x = S.grid[i];
    if (!x || !x.s || fired.has(x.id)) continue;
    fired.add(x.id); step.fired.push({ i, s: x.s });
    for (const j of area(S, i, x)) if (!cells.has(j)) { cells.add(j); queue.push(j) }
  }
  const hit = new Set();
  for (const i of cells) if (S.enc[i]) hit.add(i);
  for (const i of matched) for (const j of nbrs(S, i)) if (S.enc[j]) hit.add(j);
  for (const i of hit) { S.enc[i]--; step.cracked.push({ i, hp: S.enc[i] }); if (!S.enc[i]) bump(S, 'crack') }
  for (const i of cells) {
    const x = S.grid[i];
    if (!x) continue;
    if (x.lock) { x.lock = false; step.unlocked.push(i); bump(S, 'firewall'); continue }
    if (x.s !== 'z') bump(S, 'tiles', x.t);
    step.cleared.push({ i, id: x.id }); S.grid[i] = null;
  }
  for (const c of creates) {
    const old = S.grid[c.i];   // an unlocked firewalled tile can still sit here: consume it like a matched one
    if (old) { if (old.s !== 'z') bump(S, 'tiles', old.t); step.cleared.push({ i: c.i, id: old.id }) }
    const x = tile(S, c.t, c.s); S.grid[c.i] = x; step.created.push({ i: c.i, tile: { ...x } });
  }
  return step;
}

/* ---------- gravity ---------- */
// A cell is fed when nothing fixed (encrypted cell, firewalled tile) is above it in its column.
function fed(S, i){
  const [r, c] = rc(S, i);
  for (let k = r - 1; k >= 0; k--) { const j = k * S.n + c; if (S.enc[j] || S.grid[j]?.lock) return false }
  return true;
}
const occupied = (S, i) => S.grid[i] || S.enc[i] ? 1 : 0;
function shift(S, from, to, step){ const x = S.grid[from]; S.grid[to] = x; S.grid[from] = null; step.moves.push({ id: x.id, from, to }) }
// Passes until stable: straight down, spawn in row 0, diagonal fill for unfed cells. Roofed pockets stay empty.
function gravity(S, steps){
  const n = S.n;
  for (;;) {
    const step = { k: 'fall', moves: [], spawns: [] };
    for (let r = n - 1; r >= 0; r--) for (let c = 0; c < n; c++) {
      const i = r * n + c;
      if (S.grid[i] || S.enc[i]) continue;
      if (r === 0) { const x = tile(S, spawnColour(S, i)); S.grid[i] = x; step.spawns.push({ i, tile: { ...x } }); continue }
      if (movable(S, i - n)) { shift(S, i - n, i, step); continue }
      if (fed(S, i)) continue;
      // prefer a tile that cannot fall straight itself
      const ds = [c - 1, c + 1].filter(cc => cc >= 0 && cc < n && movable(S, (r - 1) * n + cc))
        .sort((a, b) => occupied(S, r * n + b) - occupied(S, r * n + a));
      if (ds.length) shift(S, (r - 1) * n + ds[0], i, step);
    }
    if (!step.moves.length && !step.spawns.length) return;
    steps.push(step);
  }
}

/* ---------- moves ---------- */
export const nextTo = (S, a, b) => { const [r1, c1] = rc(S, a), [r2, c2] = rc(S, b); return Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1 };
export const won = S => S.goals.every(g => g.got >= g.need);
export const lost = S => !won(S) && S.moves <= 0;

function cascade(S, steps, prefer = [], swipe = null){
  for (;;) {
    const gs = findGroups(S);
    if (!gs.length) return;
    const cells = new Set(), matched = new Set(), creates = [];
    for (const g of gs) {
      for (const i of g.cells) { cells.add(i); matched.add(i) }
      const s = specialOf(g, swipe);
      if (s) { const i = spotOf(g, s, prefer); creates.push({ i, s, t: s === 'z' ? -1 : S.grid[i].t }) }
    }
    steps.push(wave(S, cells, matched, creates));
    gravity(S, steps);
    prefer = []; swipe = null;
  }
}
// A swap with at least one special. A is the dragged tile (now at pa), B the other (now at pb).
function combo(S, A, pa, B, pb, steps){
  const cells = new Set(), fired = new Set(), [r, c] = rc(S, pa), n = S.n;
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
        if (!y.s) { y.s = o.s === 'b' ? 'b' : rnd() < .5 ? 'h' : 'v'; conv.push({ i, s: y.s }) }
        cells.add(i);
      }
      steps.push({ k: 'combo', i: pa, kind: o.s === 'b' ? 'zb' : 'zw' }, { k: 'convert', cells: conv });
    } else {
      fired.add(A.id); fired.add(B.id);
      const kind = [A.s, B.s].map(s => s === 'b' ? 'b' : 'w').sort().join('');
      if (kind === 'ww') for (let k = 0; k < n; k++) { cells.add(r * n + k); cells.add(k * n + c) }
      if (kind === 'bw') for (let d = -1; d <= 1; d++) for (let k = 0; k < n; k++) {
        if (r + d >= 0 && r + d < n) cells.add((r + d) * n + k);
        if (c + d >= 0 && c + d < n) cells.add(k * n + c + d);
      }
      if (kind === 'bb') square(S, pa, 2).forEach(i => cells.add(i));
      steps.push({ k: 'combo', i: pa, kind });
    }
  }
  steps.push(wave(S, cells, new Set(), [], fired));
  gravity(S, steps);
}
// The player drags the tile at `a` onto `b`. Resolves everything; returns the steps for the UI.
export function move(S, a, b){
  const steps = [];
  if (S.moves <= 0 || won(S) || !nextTo(S, a, b) || !movable(S, a) || !movable(S, b)) return { ok: false, steps };
  const A = S.grid[a], B = S.grid[b];
  S.grid[a] = B; S.grid[b] = A;
  steps.push({ k: 'swap', a, b });
  if (A.s || B.s) { S.moves--; combo(S, A, b, B, a, steps); cascade(S, steps) }
  else if (findGroups(S).length) { S.moves--; cascade(S, steps, [b, a], rc(S, a)[0] === rc(S, b)[0] ? 'h' : 'v') }
  else { S.grid[a] = A; S.grid[b] = B; steps.push({ k: 'back', a, b }); return { ok: false, steps } }
  if (!won(S) && S.moves > 0 && !hasMove(S)) reshuffle(S, steps);
  return { ok: true, steps };
}
// Shuffles movable tiles (seeded) until no match and a valid move; after 200 tries also redraws colours.
export function reshuffle(S, steps){
  const spots = [], tiles = [];
  for (let i = 0; i < S.n * S.n; i++) if (movable(S, i)) { spots.push(i); tiles.push(S.grid[i]) }
  const rnd = rngFor(S.seed, 13, S.shuffles++);
  for (let k = 0; k < 400; k++) {
    if (k >= 200) for (const x of tiles) if (!x.s) x.t = Math.floor(rnd() * S.k);
    for (let j = tiles.length - 1; j > 0; j--) { const m = Math.floor(rnd() * (j + 1)); [tiles[j], tiles[m]] = [tiles[m], tiles[j]] }
    spots.forEach((i, m) => S.grid[i] = tiles[m]);
    if (!findGroups(S).length && hasMove(S)) break;
  }
  steps.push({ k: 'shuffle', tiles: spots.map(i => ({ i, id: S.grid[i].id, t: S.grid[i].t })) });
}
