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

test('report by board: old logs count as square', () => {
  const log = JSON.parse(readFileSync(new URL('./fixtures/plays-sample.json', import.meta.url), 'utf8'));
  log.attempts[0].board = 'pocket';
  const rows = report([log], 'board');
  assert.deepEqual(rows.map(r => [r.level, r.attempts]), [['pocket', 1], ['square', 3], ['all', 4]]);
});

test('tool entries are not moves; gear moves count towards used', () => {
  const a = { level: 1, limit: 10, extra: 3, need: 8, end: 'won', left: 4, moves: [{ w: 2 }, { w: 2, tool: 'hammer' }, { w: 2 }] };
  const b = { level: 1, limit: 10, need: 8, end: 'left', left: null, moves: [{ w: 2, tool: 'swap' }, { w: 4 }] };
  const [r] = report([{ attempts: [a] }]);
  assert.equal(r.used, 9);
  assert.equal(r.tools, 1);
  const [s] = report([{ attempts: [{ ...a, moves: [{ w: 2 }, { w: 2 }] }] }]);
  assert.equal(r.wpm, s.wpm); assert.equal(r.big, s.big);
  const [u] = report([{ attempts: [b] }]);
  assert.equal(u.wpm, 4); assert.equal(u.big, 100); assert.equal(u.tools, 1);
});
