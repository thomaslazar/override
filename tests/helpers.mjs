import { tile } from '../src/core.js';

// Builds a state from rows of space-separated tokens:
// 'A'..'F' colour 0..5, suffix 'h' | 'v' | 'b' makes that special, suffix '!' locks it (firewall),
// 'Z' zero-day, '#1'..'#3' encrypted cell with that many hits, '.' empty cell.
export function mk(rows, o = {}){
  const n = rows.length;
  const S = { v: 1, level: 1, fails: 0, salt: 0, drop: 0, n, k: o.k ?? 6, types: [0, 1, 2, 3, 4, 5, 6],
    grid: Array(n * n).fill(null), enc: Array(n * n).fill(0),
    goals: o.goals ?? [{ kind: 'tiles', t: 0, need: 999, got: 0 }],
    moves: o.moves ?? 30, limit: o.limit ?? 30, need: 0, seed: o.seed ?? 1, spawns: 0, shuffles: 0, ids: 0, score: 0, nice: o.nice ?? false };
  rows.forEach((row, r) => row.trim().split(/\s+/).forEach((tok, c) => {
    const i = r * n + c;
    if (tok === '.') return;
    if (tok[0] === '#') { S.enc[i] = +tok.slice(1) || 1; return }
    if (tok === 'Z') { S.grid[i] = tile(S, -1, 'z'); return }
    const m = tok.match(/^([A-F])([hvb])?(!)?$/);
    if (!m) throw new Error('bad token ' + tok);
    const x = tile(S, m[1].charCodeAt(0) - 65, m[2] || null);
    if (m[3]) x.lock = true;
    S.grid[i] = x;
  }));
  return S;
}
export const ids = S => S.grid.map(x => x ? x.id : null);
