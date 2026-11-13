import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { report } from '../tools/plays.mjs';

test('report on the sample log', () => {
  const rows = report([JSON.parse(readFileSync(new URL('./fixtures/plays-sample.json', import.meta.url), 'utf8'))]);
  assert.deepEqual(rows.map(r => r.level), [1, 2, 'all']);
  const [a, b, t] = rows;
  assert.deepEqual([a.attempts, a.won, a.lost, a.left], [3, 1, 1, 1]);
  assert.equal(a.used, 12);            // finished: used 6 and 12; upper median of two
  assert.equal(a.need, 8); assert.equal(a.limit, 12);
  assert.equal(a.wpm, 2);  // 16 waves over 8 moves
  assert.equal(a.big, 25);
  assert.equal(b.used, 3);             // unlimited: logged moves
  assert.equal(t.attempts, 4);
});
