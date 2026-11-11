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
