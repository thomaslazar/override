import test from 'node:test';
import assert from 'node:assert/strict';
import { pointsOf, move, toSave, fromSave, validSave } from '../src/core.js';
import { mk } from './helpers.mjs';

test('pointsOf counts each part and the chain factor, capped at 5', () => {
  const step = { fired: [{ i: 0, s: 'h' }, { i: 1, s: 'z' }], cleared: [{}, {}, {}], cracked: [{}], unlocked: [1], created: [{}] };
  assert.equal(pointsOf(step, 1), 30 + 20 + 30 + 50 + 50 + 100);
  assert.equal(pointsOf(step, 2), 2 * 280);
  assert.equal(pointsOf(step, 9), 5 * 280);
});
test('a move adds its waves\' points to S.score, first wave at chain 1', () => {
  const S = mk(['A B A C', 'C A D E', 'D E F C', 'E F C D']);
  const r = move(S, 1, 5);
  const waves = r.steps.filter(s => s.k === 'wave');
  assert.equal(waves[0].points, 30);
  assert.equal(S.score, waves.reduce((a, w) => a + w.points, 0));
});
test('a combo is chain 1 and the cascade after it continues at 2', () => {
  const S = mk(['A B C D E', 'B C D E A', 'C Dh Ev A B', 'D E A B C', 'E A B C D'], { seed: 518, k: 5 });   // this seed's refill cascades
  const waves = move(S, 11, 12).steps.filter(s => s.k === 'wave');
  assert.ok(waves.length >= 2);
  assert.equal(waves[1].points, pointsOf(waves[1], 2));
  waves.forEach((w, k) => assert.equal(w.points, pointsOf(w, Math.min(k + 1, 5))));
  assert.equal(S.score, waves.reduce((a, w) => a + w.points, 0));
});
const big = () => mk(Array.from({ length: 7 }, (_, r) => Array.from({ length: 7 }, (_, c) => 'ABCDE'[(r * 2 + c) % 5]).join(' ')));
test('saves: score and spare optional integers; old saves load with score 0', () => {
  const S = big(); delete S.score;
  assert.equal(fromSave(toSave(S)).score, 0);
  assert.equal(validSave({ ...toSave(big()), score: 1.5 }), false);
  assert.equal(validSave({ ...toSave(big()), spare: -1 }), false);
  assert.ok(validSave({ ...toSave(big()), score: 120, spare: 3 }));
  { const o = toSave(big()); o.goals = o.goals.map(g => ({ ...g, got: 20000 })); assert.ok(validSave(o)) }
});
test('each wave records goal progress so far; cascade waves add to it', () => {
  const goals = [0, 1, 2, 3, 4].map(t => ({ kind: 'tiles', t, need: 99, got: 0 }));
  const S = mk(['A B C D E', 'B C D E A', 'C Dh Ev A B', 'D E A B C', 'E A B C D'], { seed: 518, k: 5, goals });
  const waves = move(S, 11, 12).steps.filter(s => s.k === 'wave'), sum = w => w.got.reduce((a, b) => a + b, 0);
  assert.ok(waves.length >= 2);
  for (let k = 1; k < waves.length; k++) assert.ok(sum(waves[k]) > sum(waves[k - 1]), 'wave ' + k + ' cleared tiles that count');
  assert.deepEqual(waves.at(-1).got, S.goals.map(g => g.got));
});
