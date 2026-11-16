// Board templates: whole boards drawn as text, parsed into S fields and validated. Pure.
import { dead, gravity, fillBoard, rngFor, above, isSpawner, nbrs } from './core.js';

// Rows of space-separated tokens: '.' live, 'o' hole, '#' block, 'z' live blocker zone, 'S' spawner,
// 'S0'..'S2' spawner for that drop kind only, 'iA'..'iH' / 'eA'..'eH' teleporter ingress / egress of
// pair A..H, 'X' drop point, 'D0'..'D2' live cell starting with that drop tile.
// With any 'S' only marked cells spawn, so a template with one marks its top row too.
// `mirror`: the template is not left-right symmetric and may be flipped for variety. `effort`: factor on the
// level's blocker counts and tile goals, for boards with few cascades (tuned with tools/sim.mjs to need ~ 8 + 14 d).
// Drop templates (tag 'drop', with drop points) add `every`: their drop schedule (S.drops.every; 0 = the next once none is on the board).
const T = (name, dMin, dMax, tags, mirror, effort, ...rows) => ({ name, dMin, dMax, tags, mirror, effort, rows });
export const TEMPLATES = [
  T('notch', 0, 0.4, ['shape'], false, 0.6,
    'o o . . . o o',
    'o . . . . . o',
    '. . . . . . .',
    '. . . . . . .',
    '. . . . . . .',
    'o . . . . . o',
    'o o . . . o o'),
  T('pillars', 0.1, 0.6, ['shape'], false, 0.85,
    '. . . . . . . . .',
    '. . . . . . . . .',
    '. . . . . . . . .',
    '. . # . . . # . .',
    '. . # . . . # . .',
    '. . # . . . # . .',
    '. . . . . . . . .',
    '. . . . . . . . .',
    '. . . . . . . . .'),
  T('diamond', 0.2, 0.7, ['shape'], false, 1,
    'o o o . . . o o o',
    'o o . . . . . o o',
    'o . . . . . . . o',
    '. . . . . . . . .',
    '. . . . . . . . .',
    '. . . . . . . . .',
    'o . . . . . . . o',
    'o o . . . . . o o',
    'o o o . . . o o o'),
  T('hourglass', 0.3, 0.8, ['shape'], false, 0.7,
    '. . . . . . . . .',
    'o . . . . . . . o',
    'o o . . . . . o o',
    'o o o . . . o o o',
    'o o o . . . o o o',
    'o o o . . . o o o',
    'o o . . . . . o o',
    'o . . . . . . . o',
    '. . . . . . . . .'),
  T('frame', 0.3, 0.9, ['shape'], false, 0.6,
    'o S S S S S S S o',
    'S z z z z z z z S',
    '. z . . . . . z .',
    '. z . o o o . z .',
    '. z . o o o . z .',
    '. z . o o o . z .',
    '. z . S S S . z .',
    '. z z z z z z z .',
    'o . . . . . . . o'),
  T('split', 0.4, 0.8, ['split'], false, 0.35,
    '. . . . # . . . .',
    '. . . . # . . . .',
    '. . . . # . . . .',
    '. . . . # . . . .',
    '. . . . # . . . .',
    '. . . . # . . . .',
    '. . . . # . . . .',
    '. . . . # . . . .',
    '. . . . # . . . .'),
  T('wall', 0.5, 1, ['walled', 'split'], false, 0.25,
    'S S S S S S S S S',
    '. . . . . . . . .',
    '. . . . . . . . .',
    '. . . . . . . . .',
    '# # # # # # # # #',
    'S S S S S S S S S',
    '. . . . . . . . .',
    '. . . . . . . . .',
    '. . . . . . . . .'),
  T('pocket', 0.6, 1, ['walled'], true, 0.4,
    'S S S S S S S S S',
    '. . . . . . . . .',
    '. . . . . . . . .',
    '. . . . . . . . .',
    '# # # # # . . . .',
    'S S S S # . . . .',
    'z z z z # . . . .',
    'z z z z # . . . .',
    'z z z z # . . . .'),
  // teleporters: tiles leaving an ingress (iA) come in at the top of its egress (eA)
  T('crossing', 0.2, 0.8, ['teleport'], false, 1,
    'S S S S S S S S S',
    '. . . . . . . . .',
    '. . . . . . . . .',
    '. . iA iB . iC iD . .',
    '. . # # . # # . .',
    '. . eD eC . eB eA . .',
    '. . . . . . . . .',
    '. . . . . . . . .',
    '. . . . . . . . .'),
  T('snake', 0.3, 0.8, ['teleport', 'snake'], true, 2.2,
    'S eA eB eC eD eE eF',
    '. . . . . . .',
    '. . . . z z z',
    '. . . . z z z',
    '. . . . z z z',
    '. . . . z z z',
    'iA iB iC iD iE iF .'),
  T('relay', 0.4, 1, ['teleport', 'split'], true, 0.85,
    'S S S S # eA eB eC eD',
    '. . . . # . . . .',
    'z z z z # . . . .',
    'z z z z # . . . .',
    'z z z z # . . . .',
    'z z z z # . . . .',
    'z z z z # . . . .',
    '. . . . # . . . .',
    'iA iB iC iD # . . . .'),
  // drops: drop tiles come from the spawners and leave at the drop points (X). On the chute most columns
  // end short of a drop point, so a drop needs swaps sideways along the bottom (or a worm or bomb swap)
  { ...T('chute', 0.3, 0.8, ['drop'], false, 0.75,
    'S S S S S S S S',
    '. . . . . . . .',
    '. . z z z z . .',
    '. . z z z z . .',
    '. . z z z z . .',
    '. . . . . . . .',
    '. . . . . . . .',
    '# . X . . X . #'), every: 3 },
  // corner run: the snake with a drop point at its end, so a drop runs through every column
  { ...T('corner', 0.4, 1, ['drop', 'snake', 'teleport'], true, 0.8,
    'S eA eB eC eD eE eF',
    '. . . . . . .',
    'z z z . . . .',
    'z z z . . . .',
    'z z z . . . .',
    '. . . . . . .',
    'iA iB iC iD iE iF X'), every: 0 },
  // mirrored funnel: a corner run on each side, from a spawner in the top corner to a drop point by the middle
  { ...T('funnel', 0.5, 1, ['drop', 'funnel', 'teleport', 'split'], false, 1,
    'S0 eA eB eC # eF eE eD S1',
    '. . . . # . . . .',
    '. . . . # . . . .',
    '. z z . # . z z .',
    '. z z . # . z z .',
    '. z z . # . z z .',
    '. . . . # . . . .',
    '. . . . # . . . .',
    'iA iB iC X # X iF iE iD'), every: 3 },
  // sluice: drops resting on the wall need a swap into a gap
  { ...T('sluice', 0.6, 1, ['drop', 'walled'], false, 0.7,
    'S S S S S S S S S',
    '. . . . . . . . .',
    '. . . . . . . . .',
    '. . . . . . . . .',
    '. # # . # . # # .',
    '. . . . . . . . .',
    '. z z z z z z z .',
    '. z z z z z z z .',
    'X X X X X X X X X'), every: 0 },
  // second library (docs/research/2026-11-16-board-designs.md)
  T('heart', 0, 0.5, ['shape'], false, 0.8,
    'o . . . o . . . o',
    '. . . . . . . . .',
    '. . . . . . . . .',
    '. . . . . . . . .',
    '. . . . . . . . .',
    'o . . . . . . . o',
    'o o . . . . . o o',
    'o o o . . . o o o',
    'o o o o . o o o o'),
  T('ziggurat', 0.1, 0.6, ['shape'], false, 1.1,
    'o o o . . . o o o',
    'o o o . . . o o o',
    'o o . . . . . o o',
    'o o . . . . . o o',
    'o . . . . . . . o',
    'o . . . . . . . o',
    '. . . . . . . . .',
    '. . . . . . . . .',
    '. . . . . . . . .'),
  T('bucket', 0, 0.5, ['shape'], false, 0.7,
    '. . . . . . .',
    '. . . . . . .',
    '. . . . . . .',
    'o . . . . . o',
    'o . . . . . o',
    'o o . . . o o',
    'o o . . . o o'),
  T('battlements', 0.1, 0.6, ['shape'], false, 1.5,
    '. . o o . o o . .',
    '. . o o . o o . .',
    '. . o o . o o . .',
    '. . . . . . . . .',
    '. . . . . . . . .',
    '. . . . . . . . .',
    '. . . . . . . . .',
    '. . . . . . . . .',
    '. . . . . . . . .'),
  T('offset', 0.2, 0.7, ['shape'], true, 0.85,
    '. . . . . . . .',
    '. . . . . . . .',
    '. . o o . . . .',
    '. . o o . . . .',
    '. . . . o o . .',
    '. . . . o o . .',
    '. . . . . . . .',
    '. . . . . . . .'),
  T('bowtie', 0.4, 0.9, ['shape'], false, 0.6,
    'S S S S S S S S S',
    'o . . . . . . . o',
    'o o . . . . . o o',
    'o o o . . . o o o',
    'S S . . . . . S S',
    'o o o . . . o o o',
    'o o . . . . . o o',
    'o . . . . . . . o',
    '. . . . . . . . .'),
  T('goblet', 0.3, 0.8, ['shape'], false, 0.45,
    '. . . . o . . . .',
    '. . . . o . . . .',
    '. . . . o . . . .',
    '. . . . . . . . .',
    'o o . . . . . o o',
    'o o o . . . o o o',
    'o o o . . . o o o',
    'o o . . . . . o o',
    'o . . . . . . . o'),
  T('arch', 0.1, 0.6, ['shape'], false, 0.8,
    '. . . . . . . .',
    '. . . . . . . .',
    '. . . . . . . .',
    '. . . . . . . .',
    '. . . . . . . .',
    '. . . o o . . .',
    '. . . o o . . .',
    '. . . o o . . .'),
  T('slope', 0.2, 0.7, ['shape'], true, 0.8,
    '. . . . o o o o',
    '. . . . . o o o',
    '. . . . . . o o',
    '. . . . . . . o',
    'o . . . . . . .',
    'o o . . . . . .',
    'o o o . . . . .',
    'o o o o . . . .'),
  T('terrace', 0.3, 0.8, ['shape', 'walled'], true, 0.7,
    'S S S S S o o o o',
    '. . . . . o o o o',
    '. . . . . o o o o',
    '. . . . . S S S S',
    '. . . . . . . . .',
    '. . . . . . . . .',
    'o o o o . . . . .',
    'o o o o . . . . .',
    'o o o o . . . . .'),
  T('valley', 0.1, 0.6, ['shape'], false, 1.3,
    '. . o o o o o . .',
    '. . . o o o . . .',
    '. . . . o . . . .',
    '. . . . . . . . .',
    '. . . . . . . . .',
    '. . . . . . . . .',
    '. . . . . . . . .',
    '. . . . . . . . .',
    '. . . . . . . . .'),
  T('mask', 0.2, 0.7, ['shape'], false, 1.1,
    'o o . . . . . o o',
    'o . . . . . . . o',
    '. . o o . o o . .',
    '. . o o . o o . .',
    '. . . . . . . . .',
    '. . . . . . . . .',
    '. . . . . . . . .',
    'o . . . . . . . o',
    'o o . o o o . o o'),
  T('plus', 0.2, 0.7, ['shape'], false, 0.8,
    'o o S S S S S o o',
    'o o . . . . . o o',
    'S S . . . . . S S',
    '. . . . . . . . .',
    '. . . . . . . . .',
    '. . . . . . . . .',
    '. . . . . . . . .',
    'o o . . . . . o o',
    'o o . . . . . o o'),
  T('butterfly', 0.3, 0.8, ['shape'], false, 0.75,
    '. . . . o . . . .',
    '. . . . o . . . .',
    '. . . . . . . . .',
    'o . . . . . . . o',
    'o o . . . . . o o',
    'o . . . . . . . o',
    '. . . . . . . . .',
    '. . . . o . . . .',
    '. . . . o . . . .'),
  T('vase', 0.2, 0.7, ['shape'], false, 0.75,
    'o o . . . . . o o',
    'o o o . . . o o o',
    'o o . . . . . o o',
    'o . . . . . . . o',
    '. . . . . . . . .',
    '. . . . . . . . .',
    'o . . . . . . . o',
    'o o . . . . . o o',
    'o o o . . . o o o'),
  T('gate', 0.4, 0.9, ['split', 'shape'], false, 0.4,
    '. . . . o . . . .',
    '. . . . o . . . .',
    '. . . . o . . . .',
    '. . . . . . . . .',
    '. . . . . . . . .',
    '. . . . . . . . .',
    '. . . . o . . . .',
    '. . . . o . . . .',
    '. . . . o . . . .'),
  T('tee', 0.5, 1, ['walled'], false, 0.5,
    'S S S S S S S S S',
    '. . . . . . . . .',
    '. . . . . . . . .',
    'o o # . . . # o o',
    'o o # . . . # o o',
    'S S # . . . # S S',
    '. . # z z z # . .',
    '. . . z z z . . .',
    '. . . z z z . . .'),
  T('safe', 0.5, 1, ['walled'], false, 0.45,
    'S S S S S S S S S',
    '. . . . . . . . .',
    '. . # # # # # . .',
    '. . # S S S # . .',
    '. . # z z z # . .',
    '. . # z z z # . .',
    '. . # # . # # . .',
    '. . . . . . . . .',
    '. . . . . . . . .'),
  // teleporters
  T('donut', 0.2, 0.7, ['teleport', 'shape'], false, 0.7,
    'S S S S S S S S S',
    '. . . . . . . . .',
    '. . . iA iB iC . . .',
    '. . . o o o . . .',
    '. . . o o o . . .',
    '. . . o o o . . .',
    '. . . eA eB eC . . .',
    '. . . . . . . . .',
    '. . . . . . . . .'),
  T('delta', 0.3, 0.8, ['teleport', 'funnel'], false, 1.4,
    'S S S eA S eB S S S',
    '. . . . . . . . .',
    '. . . . . . . . .',
    '. . . . . . . . .',
    '. . . . . . . . .',
    '. . . . . . . . .',
    '. . . . . . . . .',
    '. . . . . . . . .',
    '. iA . . . . . iB .'),
  // drops
  { ...T('hopper', 0.2, 0.6, ['drop', 'funnel'], false, 0.5,
    '. . . . . . . . .',
    '. . . . . . . . .',
    '. . . . . . . . .',
    'o . . . . . . . o',
    'o . . . . . . . o',
    'o o . . . . . o o',
    'o o . . . . . o o',
    'o o o . . . o o o',
    'o o o X X X o o o'), every: 3 },
  { ...T('scree', 0.3, 0.8, ['drop', 'shape'], true, 0.35,
    '. . . . o o o o',
    '. . . . . o o o',
    '. . . . . . o o',
    '. . . . . . . o',
    'o . . . . . . .',
    'o o . . . . . .',
    'o o o . . . . .',
    'o o o o . . X X'), every: 3 },
  { ...T('locket', 0.2, 0.7, ['drop', 'shape'], false, 0.3,
    'o . . o . . o',
    '. . . . . . .',
    '. . . . . . .',
    '. . . . . . .',
    'o . . . . . o',
    'o o . . . o o',
    'o o o X o o o'), every: 0 },
  { ...T('ledge', 0.4, 0.9, ['drop'], true, 0.8,
    '. . . . . . . . o',
    '. . . . . . . . o',
    '. . . . . . . . o',
    '. . . . . . . . o',
    '. . . . . . . . o',
    '. . . . . . . . X',
    '. . . . . . . . X',
    '. . . . . . . . X',
    '. X . . . X . . X'), every: 0 },
  { ...T('yoke', 0.5, 1, ['drop'], false, 0.4,
    'S0 S0 S0 S0 o S1 S1 S1 S1',
    '. . . . o . . . .',
    '. . . . o . . . .',
    '. . . . . . . . .',
    '. . . . . . . . .',
    '. . . . X . . . .',
    '. . . . o . . . .',
    '. . . . o . . . .',
    'X . . X o X . . X'), every: 3 },
  { ...T('pachinko', 0.3, 0.8, ['drop'], false, 0.45,
    '. . . . . . . . .',
    '. . . . . . . . .',
    '. . # . . . # . .',
    '. . . . # . . . .',
    '. . # . . . # . .',
    '. . . . # . . . .',
    '. . . . . . . . .',
    '. . . . . . . . .',
    'X . . . X . . . X'), every: 3 },
];

// The template's static S fields. `zone`: cells where blockers may go (the 'z' cells, or every live
// cell without a feature when none is marked). `drops`: [{ i, d }] starting drop tiles.
export const MIN_SIDE = 5, MAX_W = 11, MAX_H = 11;

export function parse(t, mirror = false){
  const h = t.rows.length, w = t.rows[0].trim().split(/\s+/).length, n = Math.max(w, h);
  // padding (right of w, below h) stays hole
  const cell = Array(n * n).fill(1), spawn = [], ins = {}, outs = {}, exit = [], drops = [], zone = [], plain = [];
  t.rows.forEach((row, r) => {
    const toks = row.trim().split(/\s+/);
    if (toks.length !== w) throw new Error(`${t.name}: row ${r} has ${toks.length} cells, not ${w}`);
    if (mirror) toks.reverse();
    toks.forEach((tok, c) => {
      const i = r * n + c;
      let m;
      cell[i] = 0;
      if (tok === '.') plain.push(i);
      else if (tok === 'o') cell[i] = 1;
      else if (tok === '#') cell[i] = 2;
      else if (tok === 'z') zone.push(i);
      else if (tok === 'X') exit.push(i);
      else if ((m = tok.match(/^S([0-2])?$/))) spawn.push({ i, d: m[1] ? +m[1] : -1 });
      else if ((m = tok.match(/^([ie])([A-H])$/))) {
        const side = m[1] === 'i' ? ins : outs;
        if (m[2] in side) throw new Error(`${t.name}: ${tok} twice`);
        side[m[2]] = i;
      }
      else if ((m = tok.match(/^D([0-2])$/))) drops.push({ i, d: +m[1] });
      else throw new Error(`${t.name}: bad token ${tok}`);
    });
  });
  const tp = Object.keys(ins).sort().map(k => [ins[k], outs[k] ?? -1]);
  for (const k of Object.keys(outs)) if (!(k in ins)) tp.push([-1, outs[k]]);
  return { n, w, h, cell: cell.some(x => x) ? cell : undefined, spawn: spawn.length ? spawn : undefined, tp, exit, zone: zone.length ? zone : plain, drops };
}

// Problems with a parsed layout, empty when it is fair: size, teleporter pairs complete, on live cells,
// one pair per cell, no egress that also spawns (it is fed only by its ingress), no gravity loop through
// a teleporter (filling an empty board does not show one), every spawner and starting drop reaches a drop
// point (on a board with drop points), every live cell gets a tile from an empty
// board by gravity (straight or diagonal), and a filled board has a legal move.
export function check(L){
  const { n } = L, w = L.w ?? n, h = L.h ?? n, out = [];
  if (w < MIN_SIDE || w > MAX_W || h < MIN_SIDE || h > MAX_H) out.push(`size ${w}x${h} is outside ${MIN_SIDE} to ${MAX_W} wide and ${MIN_SIDE} to ${MAX_H} tall`);
  const S = { v: 1, level: 1, fails: 0, salt: 0, drop: 0, n, w, h, k: 6, types: [0, 1, 2, 3, 4, 5, 6],
    grid: Array(n * n).fill(null), enc: Array(n * n).fill(0), goals: [], moves: 1, limit: 1, need: 0,
    seed: 1, spawns: 0, shuffles: 0, ids: 0, score: 0, nice: false, cell: L.cell, spawn: L.spawn, tp: L.tp };
  for (const s of L.spawn ?? []) if (dead(S, s.i)) out.push(`spawner ${s.i} is a dead cell`);
  const tp = L.tp ?? [], ends = tp.flat();
  if (ends.some(i => i < 0)) out.push('a teleporter pair is incomplete');
  if (ends.some(i => i >= 0 && dead(S, i))) out.push('a teleporter end is a dead cell');
  if (new Set(ends).size !== ends.length) out.push('a cell is in two teleporter pairs');
  if (out.length) return out;
  for (const [, e] of tp) {
    if (isSpawner(S, e)) out.push(`egress ${e} also spawns`);
    // walk up from the egress: a chain of distinct cells ends within n * n steps, a loop comes back
    let j = above(S, e);
    for (let k = 0; j >= 0 && j !== e && k < n * n; k++) j = above(S, j);
    if (j === e) out.push(`egress ${e} is in a gravity loop`);
  }
  if (L.exit?.length) {
    const dist = exitDistance(L);
    for (let i = 0; i < n * n; i++) if (isSpawner(S, i) && dist[i] === Infinity) out.push(`spawner ${i} never reaches a drop point`);
    for (const { i } of L.drops ?? []) if (dist[i] === Infinity) out.push(`drop ${i} never reaches a drop point`);
  }
  // S has no drops schedule, so no drop spawns while it settles
  gravity(S, [], true);
  for (let i = 0; i < n * n; i++) if (!dead(S, i) && !S.grid[i]) out.push(`cell ${Math.floor(i / n)},${i % n} never gets a tile`);
  if (out.length) return out;
  // fillBoard retries until a move exists; give up after many draws instead of looping forever
  const rnd = rngFor(1);
  let draws = 0;
  try { fillBoard(S, () => { if (++draws > 1e5) throw 0; return rnd() }) } catch { out.push('no legal move after filling') }
  return out;
}

// Cost from each cell to the nearest drop point (Infinity: none): 1 per cell a drop falls (through teleporters),
// `swap` per swap with a live neighbour (sideways, up or down; it needs a match, so it costs more than a fall).
// Cheapest paths back from the drop points; a board has at most 81 cells, so a plain scan for the next cell does.
export function exitDistance(L, swap = 1){
  const S = { n: L.n, cell: L.cell, tp: L.tp }, nn = L.n * L.n, dist = Array(nn).fill(Infinity), done = Array(nn).fill(false);
  for (const i of L.exit ?? []) dist[i] = 0;
  for (;;) {
    let v = -1;
    for (let i = 0; i < nn; i++) if (!done[i] && dist[i] < Infinity && (v < 0 || dist[i] < dist[v])) v = i;
    if (v < 0) return dist;
    done[v] = true;
    const a = above(S, v);
    for (const u of nbrs(S, v)) if (!dead(S, u)) dist[u] = Math.min(dist[u], dist[v] + (u === a ? 1 : swap));
    if (a >= 0 && !dead(S, a)) dist[a] = Math.min(dist[a], dist[v] + 1);
  }
}
