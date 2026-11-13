// Greedy bot over the core API. Pure. Sets each attempt's move limit (spec, Move limit from the bot).
import { move, validMoves, won, hash, rngFor } from './core.js';
import { makeAttempt } from './levels.js';

export const CAP = 80, K = 1.3, C = 2, RUNS = 3, SALTS = 10;
// Same as a JSON round trip of S (tiles, enc and goals are the only nested state move changes), but faster.
const copy = S => ({ ...S, types: [...S.types], grid: S.grid.map(x => x && { ...x }), enc: [...S.enc], goals: S.goals.map(g => ({ ...g })) });
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
// Ready-to-play attempt. First for a level: tries salts on deal 0, then lowers difficulty in steps of 0.1, until all RUNS
// bot runs finish (layout and goals). Then the bot plays DEALS seeded tile boards (deals) of that layout once each; the
// easiest and the hardest are dropped, the median sets need for every attempt of the level, and up to KEEP deals are kept.
// Memoised as {salt, drop, need, deals} (last 8 levels). An attempt plays deals[pick % deals.length]; retries keep need,
// so the move count only changes by limitFor's fail easing.
export const DEALS = 12, KEEP = 10;
const first = new Map();
function base(level){
  if (first.has(level)) return first.get(level);
  let found = null;
  for (let drop = 0; !found && drop <= 1; drop = Math.round((drop + .1) * 10) / 10) for (let salt = 0; !found && salt < SALTS; salt++) {
    const S = makeAttempt(level, 0, salt, drop);
    const r = [];   // a run that hits the cap rules the salt out, so later runs are skipped
    for (let k = 0; k < RUNS && (k === 0 || Number.isFinite(r[k - 1])); k++) r.push(solve(S, k));
    if (Number.isFinite(r[r.length - 1])) found = { salt, drop, need0: r.sort((a, b) => a - b)[RUNS >> 1] };
  }
  found ??= { salt: 0, drop: 1, need0: CAP };   // unreachable in practice; keeps the game going
  const runs = Array.from({ length: DEALS }, (_, d) => ({ d, need: d ? solve(makeAttempt(level, 0, found.salt, found.drop, d), 0) : found.need0 }))
    .filter(x => Number.isFinite(x.need)).sort((a, b) => a.need - b.need || a.d - b.d);
  const kept = runs.length > 2 ? runs.slice(1, -1) : runs;
  const f = { salt: found.salt, drop: found.drop, need: kept[kept.length >> 1].need, deals: kept.slice(0, KEEP).map(x => x.d) };
  first.set(level, f);
  if (first.size > 8) first.delete(first.keys().next().value);
  return f;
}
export function prepare(level, fails = 0, pick = 0){
  const f = base(level), S = makeAttempt(level, fails, f.salt, f.drop, f.deals[pick % f.deals.length]);
  S.need = f.need; S.limit = S.moves = limitFor(f.need, fails);
  return S;
}
