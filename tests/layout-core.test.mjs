import test from 'node:test';
import assert from 'node:assert/strict';
import { findGroups, move, gravity, dead, above, isSpawner, validSave, fromSave, toSave } from '../src/core.js';
import { mk } from './helpers.mjs';

// Rows of a match-free n x n board (colours A..E), with tokens replaced: edits = { 'r,c': token }.
const board = (n, edits = {}) => Array.from({ length: n }, (_, r) =>
  Array.from({ length: n }, (_, c) => edits[r + ',' + c] ?? 'ABCDE'[(r * 2 + c) % 5]).join(' '));
const falls = steps => steps.filter(s => s.k === 'fall');
const live = S => S.grid.map((_, i) => i).filter(i => !dead(S, i) && !S.enc[i]);

test('mk reads holes, blocks and spawners', () => {
  const S = mk(['o #B .S', 'AS A A', 'A B C']);
  assert.deepEqual(S.cell, [1, 2, 0, 0, 0, 0, 0, 0, 0]);
  assert.deepEqual(S.spawn, [{ i: 2, d: -1 }, { i: 3, d: -1 }]);
  assert.equal(S.grid[0], null);
  assert.ok(dead(S, 0) && dead(S, 1) && !dead(S, 2));
  assert.deepEqual(isSpawner(S, 3), { i: 3, d: -1 });
  assert.equal(isSpawner(S, 4), null);
  assert.equal(above(S, 1), -1);
  assert.equal(above(S, 4), 1);
});

test('without spawn data every live top-row cell is a spawner', () => {
  const S = mk(['o A B', 'A B C', 'B C A']);
  assert.equal(isSpawner(S, 0), null);
  assert.deepEqual(isSpawner(S, 1), { i: 1, d: -1 });
  assert.equal(isSpawner(S, 4), null);
});

test('dead cells never fill', () => {
  const S = mk(board(5, { '2,2': 'o', '1,2': 'Bv' }));
  const hole = 12;
  const { ok, steps } = move(S, 7, 2);   // the worm goes up to (0,2) and clears column 2
  assert.ok(ok);
  assert.equal(S.grid[hole], null);
  for (const s of falls(steps)) {
    assert.ok(s.moves.every(m => m.to !== hole && m.from !== hole));
    assert.ok(s.spawns.every(x => x.i !== hole));
  }
  assert.ok(live(S).every(i => S.grid[i]), 'every live cell refilled');
});

test('no match across a hole', () => {
  const S = mk(['A A o A A', 'B C D E B', 'C D E B C', 'D E B C D', 'E B C D E']);
  assert.equal(findGroups(S).length, 0);
});

test('worm passes over a block', () => {
  const S = mk(board(5, { '1,1': 'Ah', '2,4': '#B' }));
  const { steps } = move(S, 6, 11);   // the worm drops into row 2 and fires it
  const w = steps.find(s => s.k === 'wave');
  const cleared = w.cleared.map(x => x.i);
  for (const i of [10, 11, 12, 13]) assert.ok(cleared.includes(i), 'cleared ' + i);
  assert.ok(!cleared.includes(14));
  assert.equal(S.grid[14], null);
});

test('cell under a block fills by a diagonal slide', () => {
  const S = mk(board(5, { '1,2': '#B' }));
  S.grid[12] = S.grid[17] = null;
  const steps = [];
  gravity(S, steps);
  assert.ok(live(S).every(i => S.grid[i]), 'no live cell is empty');
  assert.ok(falls(steps).some(s => s.moves.some(m => m.from % 5 !== m.to % 5)), 'a diagonal slide');
});

test('mid-board spawner feeds a lower half', () => {
  const S = mk([
    'A B C D E A',
    'B C D E A B',
    '#B #B #B #B #B #B',
    'CS DS ES AS BS CS',
    'A A B A C D',
    'E F A B C D']);
  const { ok, steps } = move(S, 26, 32);
  assert.ok(ok);
  assert.ok(live(S).every(i => S.grid[i]), 'every live cell filled');
  for (const s of falls(steps)) {
    assert.ok(s.spawns.every(x => x.i >= 18 && x.i < 24), 'spawns only on row 3');
    assert.ok(s.moves.every(m => (m.from < 12) === (m.to < 12)), 'nothing passes row 2');
  }
  assert.ok(falls(steps).some(s => s.spawns.length));
});

test('a save without the new fields loads as before', () => {
  const S = mk(board(7));
  const o = toSave(S);
  assert.deepEqual(fromSave(o), S);
  const cell = Array(49).fill(0); cell[3] = 1; o.grid[3] = null;
  assert.ok(validSave({ ...o, cell, spawn: [{ i: 0, d: -1 }, { i: 1, d: 2 }] }));
  for (const bad of [{ cell: cell.slice(1) }, { cell: cell.map((x, i) => i ? x : 3) }, { cell: 'x' },
    { spawn: [{ i: 49, d: -1 }] }, { spawn: [{ i: -1, d: 0 }] }, { spawn: [{ i: 0, d: 3 }] }, { spawn: {} }])
    assert.equal(validSave({ ...o, ...bad }), false, JSON.stringify(bad).slice(0, 60));
});

// 5 x 5 with a teleporter from (1,0) to (3,3)
const tpBoard = (edits = {}) => mk(board(5, edits), { tp: [[5, 18]] });

test('tile falls through a teleporter', () => {
  const S = tpBoard(), x = S.grid[5];
  S.grid[18] = null;
  const steps = [];
  gravity(S, steps);
  assert.equal(S.grid[18], x);
  assert.ok(falls(steps)[0].moves.some(m => m.from === 5 && m.to === 18));
  assert.ok(live(S).every(i => S.grid[i]));
});

test('cell below an ingress is not fed from it', () => {
  const S = tpBoard();
  assert.equal(above(S, 10), -1);
  S.grid[10] = null;
  const steps = [];
  gravity(S, steps);
  assert.ok(S.grid[10]);
  assert.ok(falls(steps).every(s => s.moves.every(m => !(m.from === 5 && m.to === 10))));
});

test('cell above an egress does not feed it', () => {
  const S = tpBoard();
  assert.equal(above(S, 18), 5);
  S.grid[18] = null;
  const steps = [];
  gravity(S, steps);
  assert.ok(falls(steps).every(s => s.moves.every(m => m.from !== 13)));
});

test('egress below its ingress and pointing up the board both terminate', () => {
  for (const tp of [[[5, 20]], [[20, 5]]]) {
    const S = mk(board(5), { tp });
    for (const i of [5, 10, 15, 20]) S.grid[i] = null;
    gravity(S, []);
    const T = mk(board(5), { tp });
    T.grid[10] = null;
    gravity(T, []);
  }
  const S = mk(board(5), { tp: [[5, 20]] });
  for (const i of [5, 10, 15, 20]) S.grid[i] = null;
  gravity(S, []);
  assert.ok(live(S).every(i => S.grid[i]), 'a downward pair fills');
});

test('matches do not cross', () => {
  // A at (3,0), (4,0) and the egress (0,0) fed from the ingress (4,0): not a line
  assert.equal(findGroups(mk(['A B C D E', 'B C D E A', 'C D E A B', 'A E A B C', 'A A B C D'], { tp: [[20, 0]] })).length, 0);
  // board-adjacent ingress and egress still match
  assert.equal(findGroups(mk(['A B C D E', 'A C D E A', 'A D E A B', 'D E A B C', 'E A B C D'], { tp: [[5, 10]] })).length, 1);
});

test('blasts do not cross', () => {
  const S = mk(board(5, { '1,1': 'Ah' }), { tp: [[14, 20]] });   // ingress at the worm row's end
  const { steps } = move(S, 6, 11);
  const cleared = steps.find(s => s.k === 'wave').cleared.map(x => x.i);
  assert.ok(cleared.includes(14));
  assert.ok(!cleared.includes(20));
});

test('validSave checks teleporters and spawners', () => {
  const o = toSave(mk(board(7)));
  const cell = Array(49).fill(0); cell[3] = 1; o.grid[3] = null;
  assert.ok(validSave({ ...o, tp: [[7, 30], [8, 2]] }));
  assert.ok(validSave({ ...o, tp: [] }));
  for (const bad of [{ tp: [[7, 49]] }, { tp: [[-1, 30]] }, { tp: [[7, -1]] }, { tp: [[7, 7]] }, { tp: [[7, 30], [30, 8]] },
    { tp: [[7]] }, { tp: {} }, { cell, tp: [[3, 30]] }, { spawn: [{ i: 0, d: -1 }, { i: 0, d: 1 }] }, { cell, spawn: [{ i: 3, d: -1 }] }])
    assert.equal(validSave({ ...o, ...bad }), false, JSON.stringify(bad).slice(0, 60));
});
