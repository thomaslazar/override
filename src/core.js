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
