// Greedy bot over the core API. Pure. Sets each attempt's move limit (spec, Move limit from the bot).
import { move, validMoves, won, hash, rngFor } from './core.js';
import { makeAttempt, boardFor } from './levels.js';

export const CAP = 80, K = 1.3, C = 2, RUNS = 3, SALTS = 10, TEMPLATE_SALTS = 3;   // salts per drop on a square, on a template
// Same as a JSON round trip of S (tiles, enc, goals and drops are the only nested state move changes), but faster;
// static board arrays (cell, spawn, tp, exit) stay shared.
const copy = S => ({ ...S, types: [...S.types], grid: S.grid.map(x => x && { ...x }), enc: [...S.enc], goals: S.goals.map(g => ({ ...g })),
  ...S.drops && { drops: { ...S.drops } } });
// Goal progress first, then specials on the board, then tiles cleared (new ids).
function value(S){
  let v = won(S) ? 1e6 : 0;
  for (const g of S.goals) v += 1000 * Math.min(g.got, g.need) / g.need;
  for (const x of S.grid) if (x && x.s) v += 15;
  return v + S.ids * .5;
}
// One greedy step. Candidates run on a copy with a scrambled refill seed (independent of S.seed),
// so the bot never sees the refills that will really fall.
export function pick(S, rnd){
  const ms = validMoves(S);
  if (!ms.length) return null;
  let best = ms[0], bv = -Infinity;
  for (const [a, b] of ms) for (const [x, y] of [[a, b], [b, a]]) {
    const T = copy(S); T.seed = hash(991, S.level, S.spawns, S.moves); move(T, x, y);
    const v = value(T) + rnd() * .01;
    if (v > bv) { bv = v; best = [x, y] }
  }
  return best;
}
// Plays a copy of S with the given refill seed and no limit; returns the moves used, or Infinity at the cap.
export function solve(S0, seed, nice = false){
  const S = copy(S0);
  S.nice = nice; S.limit = 0; S.moves = CAP; S.seed = hash(S0.seed, seed, 17);
  const rnd = rngFor(seed, 19);
  while (!won(S) && S.moves > 0) {
    const best = pick(S, rnd);
    if (!best) return Infinity;
    move(S, best[0], best[1]);
  }
  return won(S) ? CAP - S.moves : Infinity;
}
export const MIN_LIMIT = 10;
export const limitFor = (need, fails) => Math.ceil(Math.max(MIN_LIMIT, Math.ceil(need * K + C)) * (1 + Math.min(.4, Math.max(0, fails - 3) * .1)));
// Ready-to-play attempt. First for a level: on the level's own board, tries salts on deal 0, then lowers difficulty in
// steps of 0.1 (to 0.5 on a template, 1 on a square), until all RUNS bot runs finish (layout and goals); a template that
// never does (TEMPLATE_SALTS salts per drop, so a hopeless one costs little) falls back to a lower-band template (fb 1), then a square (fb 2). Then the bot plays DEALS seeded tile
// boards (deals) of that layout once each; the easiest and the hardest are dropped, the median sets need for every
// attempt of the level, and up to KEEP deals are kept. Memoised as {salt, drop, fb, need, deals} (last 8 levels). An
// attempt plays deals[pick % deals.length]; retries keep need, so the move count only changes by limitFor's fail easing.
export const DEALS = 12, KEEP = 10;
// The first salt, drop and fallback whose RUNS runs all finish; `run(S, k)` plays run k (solve by default).
export function search(level, run = solve){
  for (let fb = 0; fb <= 2; fb++) {
    if (fb === 1 && boardFor(level, 1).name === boardFor(level, 0).name) continue;   // the lower band gave the same template
    const square = boardFor(level, fb).kind === 'square', most = square ? 1 : .5, salts = square ? SALTS : TEMPLATE_SALTS;
    for (let drop = 0; drop <= most; drop = Math.round((drop + .1) * 10) / 10) for (let salt = 0; salt < salts; salt++) {
      const S = makeAttempt(level, 0, salt, drop, 0, fb);
      const r = [];   // a run that hits the cap rules the salt out, so later runs are skipped
      for (let k = 0; k < RUNS && (k === 0 || Number.isFinite(r[k - 1])); k++) r.push(run(S, k));
      if (Number.isFinite(r[r.length - 1])) return { salt, drop, fb, need0: r.sort((a, b) => a - b)[RUNS >> 1] };
    }
    if (square) break;   // later fallbacks are squares too
  }
  return { salt: 0, drop: 1, fb: 2, need0: CAP };   // unreachable in practice; keeps the game going
}
const first = new Map();
function base(level){
  if (first.has(level)) return first.get(level);
  const found = search(level);
  const runs = Array.from({ length: DEALS }, (_, d) => ({ d, need: d ? solve(makeAttempt(level, 0, found.salt, found.drop, d, found.fb), 0) : found.need0 }))
    .filter(x => Number.isFinite(x.need)).sort((a, b) => a.need - b.need || a.d - b.d);
  const kept = runs.length > 2 ? runs.slice(1, -1) : runs;
  const f = { salt: found.salt, drop: found.drop, fb: found.fb, need: kept[kept.length >> 1].need, deals: kept.slice(0, KEEP).map(x => x.d) };
  first.set(level, f);
  if (first.size > 8) first.delete(first.keys().next().value);
  return f;
}
export function prepare(level, fails = 0, pick = 0){
  const f = base(level), S = makeAttempt(level, fails, f.salt, f.drop, f.deals[pick % f.deals.length], f.fb);
  S.need = f.need; S.limit = S.moves = limitFor(f.need, fails);
  return S;
}
