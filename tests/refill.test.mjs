import test from 'node:test';
import assert from 'node:assert/strict';
import { refillWeights, pressure, setsUp, spawnColour, DAMP, landingCell } from '../src/core.js';
import { mk } from './helpers.mjs';

const rows = ['. B C D', 'A E F B', 'A C D E', 'B D E F'];

test('neutral refill weighs every colour 1', () => {
  const S = mk(rows, { nice: false });
  // A at cell 0 would complete A A A down, so it is damped.
  assert.deepEqual(refillWeights(S, 0), [DAMP, 1, 1, 1, 1, 1]);
});

test('helpful refill never weighs an undamped colour below 1', () => {
  const S = mk(rows, { nice: true, goals: [{ kind: 'tiles', t: 2, need: 10, got: 0 }] });
  const w = refillWeights(S, 0);
  assert.ok(w.every((x, t) => t === 0 || x >= 1));
  assert.ok(w[2] >= 1.5, 'goal colour gets B');
});

test('direct matches get no bias, near pairs do', () => {
  const S = mk(rows, { nice: true });
  assert.equal(setsUp(S, 0, 0), false, 'A at 0 completes A A A down: direct match, no bias');
  assert.equal(setsUp(S, 0, 1), true, 'B next to B is a pair');
  assert.equal(setsUp(S, 0, 5), false);
});

test('pressure is 0 on schedule and grows when behind', () => {
  const S = mk(rows, { nice: true, limit: 20, moves: 10, goals: [{ kind: 'tiles', t: 0, need: 10, got: 5 }] });
  assert.equal(pressure(S), 0);
  S.goals[0].got = 0;
  assert.ok(pressure(S) > 0.9);
  S.limit = 0;
  assert.equal(pressure(S), 0, 'no limit (bot): no pressure');
});

test('spawnColour is seeded and advances the counter', () => {
  const a = mk(rows, { seed: 9 }), b = mk(rows, { seed: 9 });
  const xs = [0, 0, 0].map(() => spawnColour(a, 0)), ys = [0, 0, 0].map(() => spawnColour(b, 0));
  assert.deepEqual(xs, ys);
  assert.equal(a.spawns, 3);
  assert.ok(xs.every(t => t >= 0 && t < 6));
});

test('landingCell is the lowest empty cell below, or the spawn cell', () => {
  const S = mk(['. B C', '. E F', '. C D']);
  assert.equal(landingCell(S, 0), 6);
  const F = mk(['A B C', 'D E F', 'A C D']);
  assert.equal(landingCell(F, 0), 0);
});

test('a colour that completes a pair on landing is damped (nice off and on)', () => {
  const goals = [{ kind: 'tiles', t: 3, need: 10, got: 0 }];
  for (const nice of [false, true]) {
    const S = mk(['. C D', '. D C', '. B B'], { nice, k: 4, goals });
    const plain = mk(['. C D', '. D C', '. B C'], { nice, k: 4, goals });
    assert.equal(landingCell(S, 0), 6);
    const w = refillWeights(S, 0), v = refillWeights(plain, 0);
    assert.equal(w[1], nice ? v[1] * DAMP : DAMP, 'B completes B B B: damped');
    assert.equal(w[3], v[3], 'colours that complete nothing keep their weight');
  }
});

test('when every colour would complete a match, all are damped and spawn stays in range', () => {
  const S2 = mk(['. A A', '. A A', '. A A'], { k: 1 });
  assert.deepEqual(refillWeights(S2, 0), [DAMP]);
  const t = spawnColour(S2, 0);
  assert.ok(Number.isInteger(t) && t >= 0 && t < 1);
});
