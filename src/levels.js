// Level generation. Pure and seeded: an attempt follows from level, fails, salt and drop.
import { hash, rngFor, fillBoard, hasMove, reshuffle, TYPES } from './core.js';

/* ---------- chapters & difficulty ---------- */
export const CHAPTER = 30;
export const ENC_FROM = 4, FW_FROM = 7;   // first level with encrypted cells, with firewalls
export const chapterOf = level => {
  const n = Math.floor((level - 1) / CHAPTER) + 1, start = (n - 1) * CHAPTER + 1;
  return { n, start, pos: level - start + 1 };
};
export const MAX_LEVEL = 9999;   // the level picker's ceiling on a local build
// Level picker input: a whole level in 1..max; anything that is not a number keeps the fallback.
export const clampLevel = (v, max, fallback) => {
  const n = Math.floor(Number(v));
  return String(v).trim() === '' || !Number.isFinite(n) ? fallback : Math.min(max, Math.max(1, n));
};
export const breather = level => { const { pos } = chapterOf(level); return pos > 1 && pos % 5 === 1 };
// Ramp over the chapter from its base to 0.85, +0.1 on every 5th level, -0.1 on the level after.
export function difficulty(level){
  const { n, pos } = chapterOf(level), base = Math.min(.25, .05 * (n - 1));
  let d = base + (.85 - base) * (pos - 1) / (CHAPTER - 1);
  if (pos % 5 === 0) d += .1;
  if (breather(level)) d -= .1;
  return Math.max(0, Math.min(1, d));
}

/* ---------- parameters ---------- */
// My-call mappings from the spec; tune with tools/sim.mjs and by playtest.
export function paramsFor(level, fails = 0, drop = 0){
  const d = Math.max(0, difficulty(level) - drop), h = hash(level, 1) % 100;
  let k = d > .8 ? 6 : 5;
  if (fails >= 6) k = Math.max(4, k - 1);
  const n = d < .33 ? (h < 40 ? 9 : 8) : d < .66 ? (h < 15 ? 9 : h < 30 ? 7 : 8) : (h < 45 ? 7 : 8);
  const enc = level < ENC_FROM ? 0 : Math.round(n * n * (.05 + .13 * d));
  const hp = 1 + Math.min(2, Math.floor(d * 3));
  const fw = level < FW_FROM ? 0 : Math.round(1 + 4 * d);
  return { d, k, n, enc, hp, fw };
}

/* ---------- attempts ---------- */
export const GOAL = 1.2; // tile goal size factor, tuned by playtest

// Layout (encrypted cells, firewalls, goals) depends on level, salt and drop only; tiles on the deal (one of the
// level's seeded boards) and the colour count (fails ease it from the 6th).
export function makeAttempt(level, fails = 0, salt = 0, drop = 0, deal = 0){
  const p = paramsFor(level, fails, drop), n = p.n, nn = n * n, lr = rngFor(level, salt, 2);
  const order = Array.from({ length: TYPES }, (_, i) => i), tr = rngFor(level, 4);
  for (let j = TYPES - 1; j > 0; j--) { const m = Math.floor(tr() * (j + 1)); [order[j], order[m]] = [order[m], order[j]] }
  const S = { v: 1, level, fails, salt, drop, n, k: p.k, types: order.slice(0, p.k),
    grid: Array(nn).fill(null), enc: Array(nn).fill(0), goals: [], moves: 0, limit: 0, need: 0,
    deal, seed: hash(level, fails, salt, 1, deal), spawns: 0, shuffles: 0, ids: 0, nice: true };
  // goal kinds first, so only the blockers a goal uses get placed
  const gr = rngFor(level, salt, 5), wantCrack = p.enc > 0, wantFw = p.fw > 0 && (gr() < .5 || level === FW_FROM); // the tutorial hint needs a firewall
  // encrypted cells: mirrored pairs from row 2 down, at most n - 2 per row
  for (let placed = 0, guard = 0; wantCrack && placed < p.enc && guard < 500; guard++) {
    const r = 2 + Math.floor(lr() * (n - 2)), c = Math.floor(lr() * Math.ceil(n / 2)), m = n - 1 - c;
    const inRow = S.enc.slice(r * n, r * n + n).filter(Boolean).length, add = m === c ? 1 : 2;
    if (S.enc[r * n + c] || inRow + add > n - 2) continue;
    const hp = 1 + Math.floor(lr() * p.hp);
    S.enc[r * n + c] = S.enc[r * n + m] = hp;
    placed += add;
  }
  // firewall spots come from the layout stream, so they stay on retry
  const fwSpots = [];
  for (let guard = 0; wantFw && fwSpots.length < p.fw && guard < 500; guard++) {
    const i = n + Math.floor(lr() * (nn - n));
    if (!S.enc[i] && !fwSpots.includes(i)) fwSpots.push(i);
  }
  fillBoard(S, rngFor(level, salt, 3, deal));
  for (const i of fwSpots) S.grid[i].lock = true;
  if (!hasMove(S)) reshuffle(S, []);
  S.shuffles = 0;
  // goals
  const cracks = S.enc.filter(Boolean).length;
  if (cracks) S.goals.push({ kind: 'crack', need: cracks, got: 0 });
  if (fwSpots.length) S.goals.push({ kind: 'firewall', need: fwSpots.length, got: 0 });
  if (S.goals.length < 2 || gr() < .5) {
    // goals ignore fails: size from the fails-0 colour count, colours from those that survive easing
    const kBase = paramsFor(level, 0, drop).k, kGoal = Math.max(4, kBase - 1);
    const need = Math.round(GOAL * (15 + 25 * p.d) * 5 / kBase), t = Math.floor(gr() * kGoal);
    if (p.d > .5 && S.goals.length < 2 && gr() < .4) {
      const u = (t + 1 + Math.floor(gr() * (kGoal - 1))) % kGoal;
      S.goals.push({ kind: 'tiles', t, need: Math.round(need * .6), got: 0 }, { kind: 'tiles', t: u, need: Math.round(need * .6), got: 0 });
    } else S.goals.push({ kind: 'tiles', t, need, got: 0 });
  }
  return S;
}
