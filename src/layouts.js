// Board templates: whole boards drawn as text, parsed into S fields and validated. Pure.
import { dead, gravity, fillBoard, rngFor } from './core.js';

// Rows of space-separated tokens: '.' live, 'o' hole, '#' block, 'z' live blocker zone, 'S' spawner,
// 'S0'..'S2' spawner for that drop kind only, 'iA'..'iH' / 'eA'..'eH' teleporter ingress / egress of
// pair A..H, 'X' drop point, 'D0'..'D2' live cell starting with that drop tile.
// With any 'S' only marked cells spawn, so a template with one marks its top row too.
// `mirror`: the template is not left-right symmetric and may be flipped for variety. `effort`: factor on the
// level's blocker counts and tile goals, for boards with few cascades (tuned with tools/sim.mjs to need ~ 8 + 14 d).
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
];

// The template's static S fields. `zone`: cells where blockers may go (the 'z' cells, or every live
// cell without a feature when none is marked). `drops`: [{ i, d }] starting drop tiles.
export function parse(t, mirror = false){
  const n = t.rows.length, cell = Array(n * n).fill(0), spawn = [], ins = {}, outs = {}, exit = [], drops = [], zone = [], plain = [];
  t.rows.forEach((row, r) => {
    const toks = row.trim().split(/\s+/);
    if (toks.length !== n) throw new Error(`${t.name}: row ${r} has ${toks.length} cells, not ${n}`);
    if (mirror) toks.reverse();
    toks.forEach((tok, c) => {
      const i = r * n + c;
      let m;
      if (tok === '.') plain.push(i);
      else if (tok === 'o') cell[i] = 1;
      else if (tok === '#') cell[i] = 2;
      else if (tok === 'z') zone.push(i);
      else if (tok === 'X') exit.push(i);
      else if ((m = tok.match(/^S([0-2])?$/))) spawn.push({ i, d: m[1] ? +m[1] : -1 });
      else if ((m = tok.match(/^([ie])([A-H])$/))) (m[1] === 'i' ? ins : outs)[m[2]] = i;
      else if ((m = tok.match(/^D([0-2])$/))) drops.push({ i, d: +m[1] });
      else throw new Error(`${t.name}: bad token ${tok}`);
    });
  });
  const tp = Object.keys(ins).sort().map(k => [ins[k], outs[k] ?? -1]);
  for (const k of Object.keys(outs)) if (!(k in ins)) tp.push([-1, outs[k]]);
  return { n, cell: cell.some(x => x) ? cell : undefined, spawn: spawn.length ? spawn : undefined, tp, exit, zone: zone.length ? zone : plain, drops };
}

// Problems with a parsed layout, empty when it is fair: size, every live cell gets a tile from an
// empty board by gravity (straight or diagonal), and a filled board has a legal move.
export function check(L){
  const { n } = L, out = [];
  if (n < 7 || n > 9) out.push(`size ${n} is outside 7 to 9`);
  const S = { v: 1, level: 1, fails: 0, salt: 0, drop: 0, n, k: 6, types: [0, 1, 2, 3, 4, 5, 6],
    grid: Array(n * n).fill(null), enc: Array(n * n).fill(0), goals: [], moves: 1, limit: 1, need: 0,
    seed: 1, spawns: 0, shuffles: 0, ids: 0, score: 0, nice: false, cell: L.cell, spawn: L.spawn };
  for (const s of L.spawn ?? []) if (dead(S, s.i)) out.push(`spawner ${s.i} is a dead cell`);
  gravity(S, [], true);
  for (let i = 0; i < n * n; i++) if (!dead(S, i) && !S.grid[i]) out.push(`cell ${Math.floor(i / n)},${i % n} never gets a tile`);
  if (out.length) return out;
  // fillBoard retries until a move exists; give up after many draws instead of looping forever
  const rnd = rngFor(1);
  let draws = 0;
  try { fillBoard(S, () => { if (++draws > 1e5) throw 0; return rnd() }) } catch { out.push('no legal move after filling') }
  return out;
}
