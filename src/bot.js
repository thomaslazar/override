// Greedy bot over the core API. Pure. Sets each attempt's move limit (spec, Move limit from the bot).
import { move, validMoves, won, hash, rngFor } from './core.js';
import { makeAttempt } from './levels.js';

export const CAP = 80, K = 1.3, C = 2, RUNS = 3, SALTS = 10;
const copy = S => JSON.parse(JSON.stringify(S));
// Goal progress first, then specials on the board, then tiles cleared (new ids).
function value(S){
  let v = won(S) ? 1e6 : 0;
  for (const g of S.goals) v += 1000 * Math.min(g.got, g.need) / g.need;
  for (const x of S.grid) if (x && x.s) v += 15;
  return v + S.ids * .5;
}
// Plays a copy of S with the given refill seed and no limit; returns the moves used, or Infinity at the cap.
// The bot looks one move ahead including that move's refills (a mild advantage K absorbs).
export function solve(S0, seed, nice = false){
  const S = copy(S0);
  S.nice = nice; S.limit = 0; S.moves = CAP; S.seed = hash(S0.seed, seed, 17);
  const rnd = rngFor(seed, 19);
  while (!won(S) && S.moves > 0) {
    const ms = validMoves(S);
    if (!ms.length) return Infinity;
    let best = ms[0], bv = -Infinity;
    for (const [a, b] of ms) for (const [x, y] of [[a, b], [b, a]]) {
      const T = copy(S); move(T, x, y);
      const v = value(T) + rnd() * .01;
      if (v > bv) { bv = v; best = [x, y] }
    }
    move(S, best[0], best[1]);
  }
  return won(S) ? CAP - S.moves : Infinity;
}
export const limitFor = (need, fails) => Math.ceil((need * K + C) * (1 + Math.min(.4, Math.max(0, fails - 3) * .1)));
// Ready-to-play attempt: tries salts, then lowers difficulty in steps of 0.1, until all RUNS bot runs finish.
export function prepare(level, fails = 0){
  let S;
  for (let drop = 0; drop <= 1; drop = Math.round((drop + .1) * 10) / 10) for (let salt = 0; salt < SALTS; salt++) {
    S = makeAttempt(level, fails, salt, drop);
    const r = Array.from({ length: RUNS }, (_, k) => solve(S, k)).sort((a, b) => a - b);
    if (!Number.isFinite(r[RUNS - 1])) continue;
    S.need = r[RUNS >> 1];
    S.limit = S.moves = limitFor(S.need, fails);
    return S;
  }
  S.need = CAP; S.limit = S.moves = limitFor(CAP, fails);   // unreachable in practice; keeps the game going
  return S;
}
