// Level generation. Pure and seeded: an attempt follows from level, fails, salt and drop.
import { hash, rngFor, fillBoard, hasMove, reshuffle, isSpawner, TYPES } from './core.js';
import { TEMPLATES, parse } from './layouts.js';

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

/* ---------- boards ---------- */
// First levels that may use templates, teleporter templates, drop templates (each first on a breather).
export const SHAPES_FROM = 11, TP_FROM = 16, DROP_FROM = 21;
const PATTERNS = ['ring', 'wall', 'cross', 'diagonal', 'pairs'], SPIKE_TAGS = ['walled', 'split', 'funnel'];

// The level's board, from `level` only (its own stream, so the older streams keep their draws).
// fb 1: a template of a lower band (or the easiest one), fb 2: a square board. `tags`: preferred
// template tags, by default the tougher ones on every 5th level. A template is not picked again
// while it is one of the last RECENT ones (when the pool allows), and a flippable one flips side
// on each use.
const RECENT = 5, picks = [];   // picks[l]: level l's own board (fb 0, default tags), filled in level order
export function boardFor(level, fb = 0, tags){
  if (fb === 0 && tags === undefined) {
    for (let l = picks.length || 1; l <= level; l++) picks[l] = pickBoard(l, 0);
    return picks[level];
  }
  boardFor(level - 1);
  return pickBoard(level, fb, tags);
}
function pickBoard(level, fb, tags){
  const r = rngFor(level, 31), square = { kind: 'square', pattern: PATTERNS[Math.floor(r() * PATTERNS.length)] };
  const { pos } = chapterOf(level), d = difficulty(level), roll = r(), pick = r(), low = r(), mirror = r() < .5;
  // about 1 in 4 rising to 1 in 2 over a chapter; the first template level always gets one
  if (fb === 2 || level < SHAPES_FROM || (level > SHAPES_FROM && roll >= .25 + .25 * (pos - 1) / (CHAPTER - 1))) return square;
  const open = TEMPLATES.filter(t => !(t.tags.includes('teleport') && level < TP_FROM) && !(t.tags.includes('drop') && level < DROP_FROM));
  let pool = open.filter(t => d >= t.dMin && d <= t.dMax);
  tags ??= pos % 5 === 0 ? SPIKE_TAGS : [];
  const tagged = pool.filter(t => t.tags.some(x => tags.includes(x)));
  if (tagged.length) pool = tagged;
  if (!pool.length) return square;
  const before = [];   // earlier template boards, newest first
  for (let l = level - 1; l >= SHAPES_FROM && before.length < 60; l--) if (picks[l].kind === 'template') before.push(picks[l]);
  const recent = before.slice(0, Math.min(RECENT, pool.length - 1)).map(b => b.name), fresh = pool.filter(t => !recent.includes(t.name));
  let t = fresh[Math.floor(pick * fresh.length)];
  if (fb === 1) {
    const lower = open.filter(x => x.dMin < t.dMin);
    t = lower.length ? lower[Math.floor(low * lower.length)] : open.reduce((a, b) => b.dMin < a.dMin ? b : a);
  }
  const prev = before.find(b => b.name === t.name);
  return { kind: 'template', name: t.name, mirror: t.mirror && (prev ? !prev.mirror : mirror) };
}

// Order of a square pattern's cells (rows 2 and below): lower scores fill first.
function patternScore(pattern, n, r, c){
  const cr = (n + 1) / 2, cc = (n - 1) / 2, dr = r - cr, dc = c - cc;
  if (pattern === 'ring') return Math.abs(Math.max(Math.abs(dr), Math.abs(dc)) - (n % 2 ? 2 : 1.5));
  if (pattern === 'wall') return Math.abs(dr);
  if (pattern === 'cross') return Math.min(Math.abs(dr), Math.abs(dc));
  return Math.min(Math.abs(dr - dc), Math.abs(dr + dc));   // diagonal: an X
}

/* ---------- attempts ---------- */
export const GOAL = 1.2; // tile goal size factor, tuned by playtest

// Board kind and template depend on level (and the fallback fb) only; blockers and goals on level, salt
// and drop; tiles on the deal (one of the level's seeded boards) and the colour count (fails ease it from the 6th).
export function makeAttempt(level, fails = 0, salt = 0, drop = 0, deal = 0, fb = 0){
  const p = paramsFor(level, fails, drop), board = boardFor(level, fb);
  const tpl = board.kind === 'template' ? TEMPLATES.find(t => t.name === board.name) : null, L = tpl && parse(tpl, board.mirror);
  const effort = tpl ? tpl.effort : 1;
  const n = L ? L.n : p.n, nn = n * n, lr = rngFor(level, salt, 2);
  const order = Array.from({ length: TYPES }, (_, i) => i), tr = rngFor(level, 4);
  for (let j = TYPES - 1; j > 0; j--) { const m = Math.floor(tr() * (j + 1)); [order[j], order[m]] = [order[m], order[j]] }
  const S = { v: 1, level, fails, salt, drop, n, k: p.k, types: order.slice(0, p.k),
    grid: Array(nn).fill(null), enc: Array(nn).fill(0), goals: [], moves: 0, limit: 0, need: 0,
    deal, seed: hash(level, fails, salt, 1, deal), spawns: 0, shuffles: 0, ids: 0, score: 0, nice: true };
  if (L?.cell) S.cell = L.cell;
  if (L?.spawn) S.spawn = L.spawn;
  // goal kinds first, so only the blockers a goal uses get placed
  const gr = rngFor(level, salt, 5), wantCrack = p.enc > 0, wantFw = p.fw > 0 && (gr() < .5 || level === FW_FROM); // the tutorial hint needs a firewall
  const fwSpots = [];
  const inRow = r => S.enc.slice(r * n, r * n + n).filter(Boolean).length;
  if (L) {
    // templates: blockers only on zone cells, never on a spawner, at most a third of them (a packed zone
    // stalls); counts scaled from paramsFor's n * n square to the template's live cells; in a small zone
    // (a walled pocket, under 2n cells) encrypted cells take one hit, as few matches reach it
    const zone = L.zone.filter(i => !isSpawner(S, i)), room = Math.floor(zone.length / 3);
    const live = L.cell ? L.cell.filter(x => !x).length : nn, scale = effort * live / (p.n * p.n);
    const enc = Math.min(Math.round(p.enc * scale), room), fw = Math.round(p.fw * scale), hp = zone.length < 2 * n ? 1 : p.hp;
    for (let j = zone.length - 1; j > 0; j--) { const m = Math.floor(lr() * (j + 1)); [zone[j], zone[m]] = [zone[m], zone[j]] }
    for (let j = 0, placed = 0; wantCrack && placed < enc && j < zone.length; j++) {
      const i = zone[j];
      if (inRow(Math.floor(i / n)) + 1 > n - 2) continue;
      S.enc[i] = 1 + Math.floor(lr() * hp);
      placed++;
    }
    const fwRoom = room - S.enc.filter(Boolean).length;
    for (const i of zone) if (wantFw && fwSpots.length < Math.min(fw, fwRoom) && !S.enc[i]) fwSpots.push(i);
  } else if (board.pattern === 'pairs') {
    // encrypted cells: random mirrored pairs from row 2 down, at most n - 2 per row
    for (let placed = 0, guard = 0; wantCrack && placed < p.enc && guard < 500; guard++) {
      const r = 2 + Math.floor(lr() * (n - 2)), c = Math.floor(lr() * Math.ceil(n / 2)), m = n - 1 - c;
      const add = m === c ? 1 : 2;
      if (S.enc[r * n + c] || inRow(r) + add > n - 2) continue;
      const hp = 1 + Math.floor(lr() * p.hp);
      S.enc[r * n + c] = S.enc[r * n + m] = hp;
      placed += add;
    }
  } else if (wantCrack) {
    // a pattern of mirrored pairs from row 2 down, nearest the shape first, at most n - 2 per row
    const left = [];
    for (let r = 2; r < n; r++) for (let c = 0; c < Math.ceil(n / 2); c++) left.push({ r, c, s: patternScore(board.pattern, n, r, c) + .9 * lr() });
    left.sort((a, b) => a.s - b.s);
    for (let j = 0, placed = 0; placed < p.enc && j < left.length; j++) {
      const { r, c } = left[j], m = n - 1 - c, add = m === c ? 1 : 2;
      if (inRow(r) + add > n - 2) continue;
      S.enc[r * n + c] = S.enc[r * n + m] = 1 + Math.floor(lr() * p.hp);
      placed += add;
    }
  }
  // firewall spots come from the layout stream, so they stay on retry
  for (let guard = 0; !L && wantFw && fwSpots.length < p.fw && guard < 500; guard++) {
    const i = n + Math.floor(lr() * (nn - n));
    if (!S.enc[i] && !fwSpots.includes(i)) fwSpots.push(i);
  }
  fillBoard(S, rngFor(level, salt, 3, deal));
  for (const i of fwSpots) S.grid[i].lock = true;
  if (!hasMove(S)) reshuffle(S, []);
  S.shuffles = 0;
  S.board = L ? board.name : wantCrack || fwSpots.length ? `square:${board.pattern}` : 'square';
  // goals
  const cracks = S.enc.filter(Boolean).length;
  if (cracks) S.goals.push({ kind: 'crack', need: cracks, got: 0 });
  if (fwSpots.length) S.goals.push({ kind: 'firewall', need: fwSpots.length, got: 0 });
  // a template level with only a few blockers always gets a tile goal too, so it is never near free
  if (S.goals.length < 2 || gr() < .5 || L && cracks + fwSpots.length < n) {
    // goals ignore fails: size from the fails-0 colour count, colours from those that survive easing
    const kBase = paramsFor(level, 0, drop).k, kGoal = Math.max(4, kBase - 1);
    const need = Math.round(effort * GOAL * (15 + 25 * p.d) * 5 / kBase), t = Math.floor(gr() * kGoal);
    if (p.d > .5 && S.goals.length < 2 && gr() < .4) {
      const u = (t + 1 + Math.floor(gr() * (kGoal - 1))) % kGoal;
      S.goals.push({ kind: 'tiles', t, need: Math.round(need * .6), got: 0 }, { kind: 'tiles', t: u, need: Math.round(need * .6), got: 0 });
    } else S.goals.push({ kind: 'tiles', t, need, got: 0 });
  }
  return S;
}
