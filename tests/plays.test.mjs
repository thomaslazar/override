import test from 'node:test';
import assert from 'node:assert/strict';
import { logFrom, attemptOf, startAttempt, resume, close, logMove, entryOf, setOn, trim, fileOf } from '../src/plays.js';

const mkS = (level = 3, fails = 0) => ({ level, fails, n: 7, k: 4, limit: 20, need: 15, salt: 1, drop: 0, moves: 5,
  goals: [{ kind: 'tiles', t: 2, need: 9, got: 4 }, { kind: 'crack', need: 3, got: 1 }] });
const mk = S => attemptOf(S ?? mkS(), 'T');
const open = l => { const a = l.attempts.at(-1); return a && a.end === null ? a : null; };

test('logFrom repairs junk, keeps a valid log', () => {
  for (const x of [null, 'x', { attempts: 5 }, { on: 'yes' }]) {
    const l = logFrom(x);
    assert.equal(l.v, 1); assert.equal(l.on, false); assert.deepEqual(l.attempts, []); assert.equal(l.id, null);
  }
  const a = [{ level: 1, moves: [] }];
  assert.deepEqual(logFrom({ on: true, id: 'abcdefgh', attempts: a }).attempts, a);
});

test('logFrom drops attempts without a moves array', () => {
  const good = { level: 1, moves: [] };
  assert.deepEqual(logFrom({ attempts: [null, 5, {}, { moves: 1 }, good] }).attempts, [good]);
});

test('start, two moves, close as won', () => {
  const S = mkS(), l = logFrom(null), a = mk(S);
  assert.deepEqual(a.goals, [{ kind: 'tiles', t: 2, need: 9 }, { kind: 'crack', need: 3 }]);
  assert.equal(a.limit, 20); assert.equal(a.end, null);
  startAttempt(l, a); logMove(l, { n: 1 }); logMove(l, { n: 2 });
  close(l, 'won', S, 42);
  assert.equal(a.moves.length, 2); assert.equal(a.end, 'won'); assert.equal(a.left, 15); assert.equal(a.t, 42);
  assert.equal(open(l), null);
});

test('resume', () => {
  const l = logFrom(null), a = mk();
  startAttempt(l, a);
  assert.equal(resume(l, mkS(3, 0)), true); assert.equal(a.end, null);
  assert.equal(resume(l, mkS(3, 1)), false); assert.equal(a.end, 'left'); assert.equal(a.left, null);
  const b = mk(); startAttempt(l, b);
  assert.equal(resume(l, mkS(4, 0)), false); assert.equal(b.end, 'left');
});

test('entryOf', () => {
  const steps = [{ k: 'swap' }, { k: 'wave', fired: [{ i: 1, s: 'h' }], cleared: [{}, {}, {}], created: [{}] },
    { k: 'fall' }, { k: 'wave', fired: [], cleared: [{}, {}, {}, {}], created: [] }, { k: 'shuffle' }];
  assert.deepEqual(entryOf(mkS(), steps, 4), { n: 4, w: 2, c: 7, sm: 1, sf: 1, g: [4, 1], sh: 1 });
  assert.equal(entryOf(mkS(), [{ k: 'back' }], 1).sh, 0);
});

test('trim drops oldest closed, never the open one', () => {
  const l = logFrom(null);
  for (let i = 0; i < 200; i++) { const a = mk(); a.level = i; a.moves = Array.from({ length: 50 }, (_, n) => ({ n })); startAttempt(l, a); }
  trim(l, 20000);
  assert.ok(JSON.stringify(l).length <= 20000);
  assert.equal(l.attempts.at(-1).level, 199); assert.equal(open(l), l.attempts.at(-1));
});

test('setOn off drops the open attempt', () => {
  const l = logFrom(null);
  startAttempt(l, mk()); close(l, 'won'); startAttempt(l, mk());
  setOn(l, false); assert.equal(l.attempts.length, 1); assert.equal(open(l), null);
});

test('fileOf', () => {
  const l = logFrom({ id: 'abcdefgh' });
  const f = fileOf(l, { w: 390 }, new Date('2026-11-13T10:00:00Z'));
  assert.equal(f.name, 'override-plays-2026-11-13.json');
  const o = JSON.parse(f.text); assert.equal(o.v, 1); assert.equal(o.id, 'abcdefgh'); assert.equal(o.device.w, 390); assert.deepEqual(o.attempts, []);
});
