import test from 'node:test';
import assert from 'node:assert/strict';
import { hash, mulberry32, findGroups, specialOf, spotOf, lineAt, validMoves, hasMove, fillBoard, rngFor } from '../src/core.js';
import { mk } from './helpers.mjs';

test('random is deterministic', () => {
  assert.equal(hash(1, 2, 3), hash(1, 2, 3));
  assert.notEqual(hash(1, 2, 3), hash(1, 2, 4));
  const a = mulberry32(7), b = mulberry32(7);
  for (let i = 0; i < 5; i++) assert.equal(a(), b());
});

test('a row of three is one group, no special', () => {
  const S = mk(['A A A B', 'B C D E', 'C D E F', 'D E F A']);
  const gs = findGroups(S);
  assert.equal(gs.length, 1);
  assert.deepEqual([...gs[0].cells].sort((a, b) => a - b), [0, 1, 2]);
  assert.equal(specialOf(gs[0], null), null);
});

test('L shape is one group and makes a logic bomb at the corner', () => {
  const S = mk(['A A A B', 'A C D E', 'A D E F', 'B E F C']);
  const gs = findGroups(S);
  assert.equal(gs.length, 1);
  assert.equal(gs[0].cells.size, 5);
  assert.equal(specialOf(gs[0], null), 'b');
  assert.equal(spotOf(gs[0], 'b', []), 0);
});

test('four in a line makes a worm: swipe decides, else the line', () => {
  const S = mk(['B A A A A', 'C D E F C', 'D E F C D', 'E F C D E', 'F C D E F']);
  const [g] = findGroups(S);
  assert.equal(specialOf(g, null), 'h');
  assert.equal(specialOf(g, 'v'), 'v');
  const V = mk(['A B C', 'A C D', 'A D E', 'A E F']);
  assert.equal(specialOf(findGroups(V)[0], null), 'v');
});

test('five in a line makes a zero-day; placement prefers the swapped cell', () => {
  const S = mk(['A A A A A', 'C D E F C', 'D E F C D', 'E F C D E', 'F C D E F']);
  const [g] = findGroups(S);
  assert.equal(specialOf(g, 'h'), 'z');
  assert.equal(spotOf(g, 'z', [3]), 3);
  assert.equal(spotOf(g, 'z', []), 2);
});

test('zero-days never match; worms and bombs match by colour', () => {
  const S = mk(['Z Z Z B', 'Ah A A C', 'C D E F', 'D E F C']);
  const gs = findGroups(S);
  assert.equal(gs.length, 1);
  assert.deepEqual([...gs[0].cells].sort((a, b) => a - b), [4, 5, 6]);
});

test('valid moves include matching swaps and any swap with a special', () => {
  const S = mk(['A B A', 'C A D', 'E F C']);
  const ms = validMoves(S).map(m => m.join('-'));
  assert.ok(ms.includes('1-4'), 'swapping B down makes A A A');
  const T = mk(['A B C', 'D Eh F', 'B C A']);
  assert.ok(hasMove(T), 'a special next to a tile is a move');
  const D = mk(['A B C', 'B C A', 'C A B'], { k: 3 });
  assert.equal(hasMove(D), false);
  assert.equal(lineAt(S, 0), false);
});

test('locked tiles and encrypted cells cannot be swapped', () => {
  const S = mk(['A B! A', 'C A D', 'E F C']);
  assert.ok(!validMoves(S).some(([a, b]) => a === 1 || b === 1));
});

test('fillBoard leaves no match and at least one move', () => {
  for (let seed = 1; seed <= 20; seed++) {
    const S = mk(Array(8).fill('. . . . . . . .'), { k: 5 });
    S.enc[20] = 2; S.enc[43] = 1;
    fillBoard(S, rngFor(seed));
    assert.equal(findGroups(S).length, 0);
    assert.ok(hasMove(S));
    assert.equal(S.grid[20], null);
    assert.ok(S.grid.filter(Boolean).every(x => x.t >= 0 && x.t < 5));
  }
});

import { move, reshuffle, won, lost, validMoves as vm, findGroups as fg, hasMove as hm } from '../src/core.js';
import { ids } from './helpers.mjs';

const wave = steps => steps.find(s => s.k === 'wave');
const idx = (S, r, c) => r * S.n + c;

test('a swap without a match is undone and costs nothing', () => {
  const S = mk(['A B C', 'D E F', 'B C A']);
  const before = ids(S), { ok, steps } = move(S, 0, 1);
  assert.equal(ok, false);
  assert.deepEqual(steps.map(s => s.k), ['swap', 'back']);
  assert.deepEqual(ids(S), before);
  assert.equal(S.moves, 30);
});

test('a sideways swipe that makes four makes a row worm on the landing cell', () => {
  // column 0 is A A B A; dragging the A at (2,1) left onto (2,0) makes four A vertically
  const S = mk(['A B C D', 'A C D B', 'B A D C', 'A D B C'], { k: 4 });
  const { ok, steps } = move(S, idx(S, 2, 1), idx(S, 2, 0));
  assert.ok(ok);
  assert.equal(S.moves, 29);
  const w = wave(steps);
  assert.deepEqual(w.created.map(c => [c.i, c.tile.s, c.tile.t]), [[idx(S, 2, 0), 'h', 0]]);
});

test('a special fires on any swap where it lands', () => {
  const S = mk(['A B C D', 'E Ah F B', 'C D E F', 'D E F A']);
  const { ok, steps } = move(S, idx(S, 1, 1), idx(S, 1, 2));
  assert.ok(ok);
  const w = wave(steps);
  assert.deepEqual(w.fired, [{ i: idx(S, 1, 2), s: 'h' }]);
  for (let c = 0; c < 4; c++) assert.ok(w.cleared.some(x => x.i === idx(S, 1, c)), 'row 1 cleared');
});

test('zero-day swapped with a tile clears that colour', () => {
  const S = mk(['C B C D', 'E Z C B', 'C D E F', 'D C F A'], { goals: [{ kind: 'tiles', t: 2, need: 99, got: 0 }] });
  const cs = S.grid.filter(x => x && x.t === 2).length;
  move(S, idx(S, 1, 1), idx(S, 1, 2));
  assert.ok(S.goals[0].got >= cs);
});

const comboCase = (rows, a, b) => { const S = mk(rows); const r = move(S, a, b); return { S, ...r, cleared: new Set(wave(r.steps).cleared.map(x => x.i)) } };

test('worm + worm clears a cross at the landing cell', () => {
  const { S, steps, cleared } = comboCase(['A B C D E', 'B C D E A', 'C Dh Ev A B', 'D E A B C', 'E A B C D'], 11, 12);
  assert.equal(steps.find(s => s.k === 'combo').kind, 'ww');
  for (let k = 0; k < 5; k++) { assert.ok(cleared.has(idx(S, 2, k))); assert.ok(cleared.has(idx(S, k, 2))) }
});

test('worm + bomb clears three rows and three columns', () => {
  const { S, cleared } = comboCase(['A B C D E', 'B C D E A', 'C Dh Eb A B', 'D E A B C', 'E A B C D'], 11, 12);
  for (let d = -1; d <= 1; d++) for (let k = 0; k < 5; k++) { assert.ok(cleared.has(idx(S, 2 + d, k))); assert.ok(cleared.has(idx(S, k, 2 + d))) }
});

test('bomb + bomb clears 5x5', () => {
  const { cleared } = comboCase(['A B C D E', 'B C D E A', 'C Db Eb A B', 'D E A B C', 'E A B C D'], 11, 12);
  assert.equal(cleared.size, 25);
});

test('zero-day + zero-day clears the whole board', () => {
  const { cleared } = comboCase(['A B C D', 'B Z Z A', 'C D A B', 'D A B C'], 5, 6);
  assert.equal(cleared.size, 16);
});

test('zero-day + worm turns every tile of the worm colour into a special', () => {
  const { steps } = comboCase(['A B C D', 'B Z Ch A', 'C D A B', 'D A C C'], 5, 6);
  const conv = steps.find(s => s.k === 'convert');
  assert.equal(conv.cells.length, 4, 'four plain C tiles converted');
  assert.ok(conv.cells.every(x => x.s === 'h' || x.s === 'v'));
});

test('specials hit by a blast fire too (chain)', () => {
  // the worm lands on (0,1) and fires row 0, which holds a bomb
  const S = mk(['A B C Db', 'E Ah F B', 'C D E F', 'D E F A']);
  const w = wave(move(S, idx(S, 1, 1), idx(S, 0, 1)).steps);
  assert.ok(w.fired.some(f => f.s === 'b'), 'bomb in the worm row fires');
});

test('encrypted cells lose one hit per wave and count when cracked', () => {
  // swap makes A A A on row 0 above a #1 and a #2: both are next to matched cells
  const S = mk(['A A B A', '#1 #2 C D', 'C D E F', 'D E F C'], { goals: [{ kind: 'crack', need: 2, got: 0 }] });
  const w = wave(move(S, idx(S, 0, 3), idx(S, 0, 2)).steps);
  assert.deepEqual(w.cracked.map(x => [x.i, x.hp]).sort(), [[4, 0], [5, 1]]);
  assert.ok(S.goals[0].got >= 1, 'the #1 cracked (later cascades may crack more)');
});

test('a firewall stops swaps; a match through it frees the tile', () => {
  const S = mk(['A! B A', 'C A D', 'E F C'], { goals: [{ kind: 'firewall', need: 1, got: 0 }] });
  assert.equal(move(S, 0, 1).ok, false);
  const T = mk(['A A! B A', 'C D E F', 'D E F C', 'E F C D'], { goals: [{ kind: 'firewall', need: 1, got: 0 }] });
  const w = wave(move(T, 3, 2).steps);
  assert.deepEqual(w.unlocked, [1]);
  assert.equal(T.goals[0].got, 1);
  assert.ok(T.grid[1] && !T.grid[1].lock, 'tile stays, lock gone');
});

test('cells under an encrypted cell fill diagonally; a roofed pocket stays empty', () => {
  // any legal move runs gravity over the whole board
  const T = mk(['A B C D E', 'B #3 #3 #3 A', 'C D . F B', 'D E F A C', 'E A A C D']);
  const pocket = idx(T, 2, 2);
  const legal = vm(T)[0];
  assert.ok(legal, 'fixture has a legal move');
  move(T, ...legal);
  assert.equal(T.grid[pocket], null, 'roofed by #3 #3 #3 with no tile diagonally above');
  const U = mk(['A B C D', 'B #3 C D', 'C . E C', 'D E F A']);
  const m = vm(U)[0];
  assert.ok(m, 'fixture has a legal move');
  move(U, ...m);
  assert.ok(U.grid[idx(U, 2, 1)], 'filled from above left or right');
});

test('reshuffle leaves no match and a valid move', () => {
  const S = mk(['A B C', 'B C A', 'C A B'], { k: 3 });
  const steps = [];
  reshuffle(S, steps);
  assert.equal(fg(S).length, 0);
  assert.ok(hm(S));
  assert.equal(steps[0].k, 'shuffle');
});

test('won and lost', () => {
  const S = mk(['A B', 'B A'], { goals: [{ kind: 'tiles', t: 0, need: 1, got: 1 }], moves: 0 });
  assert.ok(won(S)); assert.ok(!lost(S));
  S.goals[0].got = 0; assert.ok(lost(S));
});

// Replays steps on an id grid; must end equal to S.grid. This is the UI contract.
function replay(n, start, steps){
  const g = start.slice();
  for (const s of steps) {
    if (s.k === 'swap' || s.k === 'back') [g[s.a], g[s.b]] = [g[s.b], g[s.a]];
    if (s.k === 'wave') { for (const c of s.cleared) g[c.i] = null; for (const c of s.created) g[c.i] = c.tile.id }
    if (s.k === 'fall') { for (const m of s.moves) { g[m.to] = m.id; if (g[m.from] === m.id) g[m.from] = null } for (const p of s.spawns) g[p.i] = p.tile.id }
    if (s.k === 'shuffle') for (const x of s.tiles) g[x.i] = x.id;
  }
  return g;
}

test('steps replay to the final grid over many random moves', () => {
  for (let seed = 1; seed <= 5; seed++) {
    const S = mk(Array(8).fill('. . . . . . . .'), { k: 5, seed, nice: true, moves: 999, limit: 999 });
    S.enc[27] = 3; S.enc[28] = 3; S.grid[40] = null;
    fillBoard(S, rngFor(seed));
    S.grid[50].lock = true;
    const r = rngFor(seed, 99);
    for (let k = 0; k < 60; k++) {
      const ms = vm(S); if (!ms.length) break;
      const [a, b] = ms[Math.floor(r() * ms.length)];
      const start = ids(S), { steps } = move(S, a, b);
      assert.deepEqual(replay(S.n, start, steps), ids(S), `seed ${seed} move ${k}`);
      assert.equal(fg(S).length, 0, 'no match left after a move');
      assert.ok(hm(S), 'never a dead board');
    }
  }
});

test('a new special consumes an unlocked firewalled tile under it', () => {
  // row 0 is a pre-existing run of four; its middle spot (cell 2) holds a firewalled tile
  const S = mk(['A A A! A', 'B C D E', 'E D C F', 'F B C D'], { goals: [{ kind: 'firewall', need: 1, got: 0 }, { kind: 'tiles', t: 0, need: 99, got: 0 }] });
  const old = S.grid[2].id, start = ids(S), { ok, steps } = move(S, 5, 6);
  assert.ok(ok);
  const w = wave(steps);
  assert.deepEqual(w.unlocked, [2]);
  assert.ok(w.cleared.some(x => x.i === 2 && x.id === old), 'old tile id is cleared');
  assert.deepEqual(w.created.map(c => [c.i, c.tile.s]), [[2, 'h']]);
  assert.equal(S.goals[0].got, 1);
  assert.ok(S.goals[1].got >= 4, 'all four A tiles counted');
  assert.deepEqual(replay(S.n, start, steps), ids(S));
});

test('without blockers nothing ever falls diagonally', () => {
  for (let seed = 1; seed <= 3; seed++) {
    const S = mk(Array(8).fill('. . . . . . . .'), { k: 5, seed, nice: true, moves: 999, limit: 999 });
    fillBoard(S, rngFor(seed));
    const r = rngFor(seed, 99);
    for (let k = 0; k < 40; k++) {
      const ms = vm(S); if (!ms.length) break;
      const [a, b] = ms[Math.floor(r() * ms.length)];
      for (const s of move(S, a, b).steps) if (s.k === 'fall') for (const m of s.moves) assert.equal(m.from % S.n, m.to % S.n, 'straight down only');
    }
  }
});

import { validSave, fromSave, toSave } from '../src/core.js';

test('saves round trip and reject broken data', () => {
  const S = mk([...Array(6).fill('A B C D E F A'), 'A B C D E F Bh!']);
  S.enc[10] = 2;
  const o = JSON.parse(JSON.stringify(toSave(S)));
  assert.ok(validSave(o));
  assert.deepEqual(fromSave(o), S);
  for (const bad of [null, 5, {}, { ...o, v: 2 }, { ...o, grid: o.grid.slice(1) }, { ...o, level: 0 }, { ...o, goals: [] },
    { ...o, grid: o.grid.map((x, i) => i ? x : { id: 1, t: 9, s: null, lock: false }) }, { ...o, enc: o.enc.map(() => -1) }])
    assert.equal(validSave(bad), false, JSON.stringify(bad)?.slice(0, 60));
});
