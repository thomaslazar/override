import test from 'node:test';
import assert from 'node:assert/strict';
import { findGroups, specialOf, spotOf, lineAt, swapLegal, move, fillBoard, gravity, rngFor, rocketTargets, validSave, toSave } from '../src/core.js';
import { mk } from './helpers.mjs';

const sorted = s => [...s].sort((a, b) => a - b);
const waves = steps => steps.filter(s => s.k === 'wave');

test('a 2x2 square of one colour is a group and makes a rocket', () => {
  const S = mk(['A A B', 'A A C', 'B C D']);
  const gs = findGroups(S);
  assert.equal(gs.length, 1);
  assert.deepEqual(sorted(gs[0].cells), [0, 1, 3, 4]);
  assert.equal(specialOf(gs[0], null), 'r');
  assert.equal(spotOf(gs[0], 'r', []), 0);
  assert.ok(lineAt(S, 4));
});

test('a square sharing a cell with a line merges; the stronger special wins', () => {
  const one = rows => { const gs = findGroups(mk(rows)); assert.equal(gs.length, 1); return gs[0] };
  assert.equal(specialOf(one(['A A A', 'A A B', 'B C D']), null), 'r', 'a lone 3-line adds nothing');
  const b = one(['A A A', 'A A B', 'A B C']);
  assert.equal(specialOf(b, null), 'b', 'square with crossing lines makes a bomb');
  assert.equal(spotOf(b, 'b', []), 0);
  assert.equal(specialOf(one(['A A A A A', 'A A B C D']), null), 'z');
  const w = one(['A A A A', 'A A B C']);
  assert.equal(specialOf(w, null), 'h');
  assert.equal(specialOf(w, 'v'), 'v');
  const gs = findGroups(mk(['A A B C C C', 'A A B D E F']));
  assert.equal(gs.length, 2);
  assert.deepEqual(gs.map(g => specialOf(g, null)).sort((a, b) => String(a).localeCompare(String(b))), [null, 'r']);
});

test('swapping into a square is a legal move and makes a rocket on the swapped cell', () => {
  const S = mk(['A A C', 'A B A', 'C D E']);
  assert.ok(swapLegal(S, 5, 4));
  const r = move(S, 5, 4);
  assert.ok(r.ok);
  assert.deepEqual(waves(r.steps)[0].created.map(c => [c.i, c.tile.s, c.tile.t]), [[4, 'r', 0]]);
});

const LINE = ['Ar A B C', 'D E A F', 'E F D E', 'F D E D'];

test('a rocket matches by colour and fires when matched', () => {
  const S = mk(LINE);
  const r = move(S, 6, 2);
  assert.ok(r.ok);
  const w = waves(r.steps)[0];
  assert.deepEqual(w.fired, [{ i: 0, s: 'r' }]);
  assert.equal(w.cleared.length, 6, 'three matched plus three targets');
});

test('a double tap fires a rocket in place for one move', () => {
  const S = mk(LINE);
  const r = move(S, 0, 0);
  assert.ok(r.ok);
  assert.equal(S.moves, 29);
  const w = waves(r.steps)[0];
  assert.deepEqual(w.fired, [{ i: 0, s: 'r' }]);
  assert.equal(w.cleared.length, 4);
});

test('a fired rocket hits 3 distinct targets in preference order', () => {
  const rows = ['D E F D E', 'E B! D E F', 'F D Ar F D', 'D #1 E C E', 'E F D E F'];
  const goals = [{ kind: 'tiles', t: 2, need: 5, got: 0 }];
  assert.deepEqual(rocketTargets(mk(rows, { goals }), 12, 3, new Set([12])), [6, 16, 18]);
  const S = mk(rows, { goals });
  const w = waves(move(S, 12, 12).steps)[0];
  assert.deepEqual(w.unlocked, [6]);
  assert.deepEqual(w.cracked, [{ i: 16, hp: 0 }]);
  assert.ok(w.cleared.some(c => c.i === 18));
});

test('rocket targets are never drops, holes, blocks or cells the wave already clears; fewer cells, fewer targets', () => {
  const S = mk(['Ar B o', '#B D0 C']);
  assert.deepEqual(rocketTargets(S, 0, 3, new Set([0, 1])), [5]);
  assert.deepEqual(sorted(rocketTargets(S, 0, 3, new Set([0]))), [1, 5]);
});

test('the tile under a drop is preferred over a random tile', () => {
  for (let seed = 1; seed <= 20; seed++) {
    const S = mk(['D0 B C', 'C D E', 'E F Dr'], { seed, goals: [{ kind: 'crack', need: 1, got: 0 }] });
    assert.deepEqual(rocketTargets(S, 8, 1, new Set([8])), [3]);
  }
});

test('fillBoard and the refill damping leave no 2x2 square', () => {
  for (let seed = 1; seed <= 500; seed++) {
    const S = mk(Array(7).fill('. . . . . . .'), { k: 4 });
    fillBoard(S, rngFor(seed));
    assert.equal(findGroups(S).length, 0, `seed ${seed}`);
  }
  // the empty corner spawns A one time in three; damping recolours most of the squares that makes
  let squares = 0;
  for (let seed = 1; seed <= 300; seed++) {
    const S = mk(['. A B C', 'A A C B', 'B C B C', 'C B C B'], { k: 3, seed });
    gravity(S, []);
    if (findGroups(S).length) squares++;
  }
  assert.ok(squares > 0 && squares / 300 < 0.15, `${squares} squares survived`);
});

test('validSave accepts rocket tiles', () => {
  const S = mk([...Array(4).fill('A B C D E'), 'B C D E Ar']);
  assert.ok(validSave(JSON.parse(JSON.stringify(toSave(S)))));
});

// 9 x 9, no match: colour (2r + c) mod 5; `put` sets specials, e.g. { 40: 'Ar' }
const big = (put = {}) => mk(Array.from({ length: 9 }, (_, r) => Array.from({ length: 9 }, (_, c) => put[r * 9 + c] ?? 'ABCDE'[(2 * r + c) % 5]).join(' ')));
const combo = steps => steps.find(s => s.k === 'combo');

test('rocket + rocket fires 8 rockets', () => {
  const S = big({ 40: 'Ar', 41: 'Br' });
  const r = move(S, 40, 41);
  assert.ok(r.ok);
  assert.equal(combo(r.steps).kind, 'rr');
  const w = waves(r.steps)[0], to = w.rockets.map(f => f.to);
  assert.equal(w.rockets.length, 8);
  assert.equal(new Set(to).size, 8);
  assert.ok(w.rockets.every(f => f.from === 41) && !to.includes(40) && !to.includes(41));
  assert.equal(w.cleared.length, 10);
});

test('rocket + worm: 3 targets, each sets off a worm there', () => {
  const S = big({ 40: 'Ar', 41: 'Bh' });
  const r = move(S, 40, 41);
  assert.equal(combo(r.steps).kind, 'rw');
  const w = waves(r.steps)[0], got = new Set(w.cleared.map(c => c.i));
  assert.equal(w.rockets.length, 3);
  for (const { to } of w.rockets) {
    const row = Array.from({ length: 9 }, (_, k) => Math.floor(to / 9) * 9 + k), col = Array.from({ length: 9 }, (_, k) => k * 9 + to % 9);
    assert.ok(row.every(i => got.has(i)) || col.every(i => got.has(i)), `line through ${to}`);
  }
});

test('rocket + bomb: 3 targets, each sets off a 3x3 blast there', () => {
  const S = big({ 40: 'Ab', 41: 'Br' });
  const r = move(S, 40, 41);
  assert.equal(combo(r.steps).kind, 'rb');
  const w = waves(r.steps)[0], got = new Set(w.cleared.map(c => c.i));
  assert.equal(w.rockets.length, 3);
  for (const { to } of w.rockets) {
    const tr = Math.floor(to / 9), tc = to % 9;
    for (let a = tr - 1; a <= tr + 1; a++) for (let b = tc - 1; b <= tc + 1; b++)
      if (a >= 0 && a < 9 && b >= 0 && b < 9) assert.ok(got.has(a * 9 + b), `${a * 9 + b} near ${to}`);
  }
});

test('rocket + zero-day turns every tile of the rocket\'s colour into a rocket and fires them all', () => {
  const S = big({ 40: 'Z', 41: 'Ar' });
  const As = S.grid.filter(x => x && x.t === 0).length;
  const r = move(S, 40, 41);
  assert.equal(combo(r.steps).kind, 'zr');
  const conv = r.steps.find(s => s.k === 'convert');
  assert.equal(conv.cells.length, As - 1);
  assert.ok(conv.cells.every(c => c.s === 'r'));
  const w = waves(r.steps)[0];
  assert.equal(w.fired.filter(f => f.s === 'r').length, As);
  assert.equal(w.rockets.length, 3 * As);
  assert.equal(new Set(w.rockets.map(f => f.to)).size, 3 * As);
});

test('a rocket wave step lists its flights', () => {
  const S = mk(LINE);
  const w = waves(move(S, 0, 0).steps)[0];
  assert.equal(w.rockets.length, 3);
  assert.ok(w.rockets.every(f => f.from === 0));
  assert.deepEqual(sorted(w.rockets.map(f => f.to)), sorted(w.cleared.map(c => c.i).filter(i => i !== 0)));
});
