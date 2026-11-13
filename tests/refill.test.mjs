import test from 'node:test';
import assert from 'node:assert/strict';
import { move, refillWeights, pressure, setsUp, spawnColour } from '../src/core.js';
import { mk } from './helpers.mjs';

const rows = ['. B C D', 'A E F B', 'A C D E', 'B D E F'];

test('neutral refill weighs every colour 1', () => {
  const S = mk(rows, { nice: false });
  assert.deepEqual(refillWeights(S, 0), [1, 1, 1, 1, 1, 1]);
});

test('helpful refill never weighs a colour below 1', () => {
  const S = mk(rows, { nice: true, goals: [{ kind: 'tiles', t: 2, need: 10, got: 0 }] });
  const w = refillWeights(S, 0);
  assert.ok(w.every(x => x >= 1));
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


test('a refill that makes a line survives about DAMP of the time (shown by a second wave)', () => {
  let cascaded = 0, n = 0;
  for (let seed = 1; seed <= 200; seed++) {
    const S = mk(['A A B A A', 'C C A C C', 'B C A B C', 'C B C C B', 'B C B C B'], { k: 3, seed });
    const r = move(S, 2, 7);
    if (!r.ok) continue;
    n++;
    if (r.steps.filter(s => s.k === 'wave').length > 1) cascaded++;
  }
  assert.ok(n > 100);
  assert.ok(cascaded / n > 0.02 && cascaded / n < 0.3);
});

test('spawn records carry the final colour of the tile', () => {
  for (let seed = 1; seed <= 100; seed++) {
    const S = mk(['A A B A A', 'C C A C C', 'B C A B C', 'C B C C B', 'B C B C B'], { k: 3, seed });
    const r = move(S, 2, 7);
    if (!r.ok) continue;
    const spawns = r.steps.filter(s => s.k === 'fall').flatMap(s => s.spawns);
    for (const { tile } of spawns) {
      const x = S.grid.find(g => g && g.id === tile.id);
      if (x) assert.equal(x.t, tile.t);
    }
  }
});
