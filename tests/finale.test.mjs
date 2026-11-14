import test from 'node:test';
import assert from 'node:assert/strict';
import { finale } from '../src/core.js';
import { mk } from './helpers.mjs';

const rows = (n, f) => Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => f(r, c)).join(' '));
const plain = n => rows(n, (r, c) => 'ABCDE'[(r * 2 + c) % 5]);   // no line of three
const won1 = [{ kind: 'tiles', t: 0, need: 1, got: 1 }];
const specials = S => S.grid.some(x => x && x.s);

test('finale fires every leftover special and spends spare moves; deterministic', () => {
  const build = () => {
    const r = plain(7).map(l => l.split(' '));
    r[1][1] += 'h'; r[4][4] += 'b';
    return mk(r.map(l => l.join(' ')), { goals: won1, moves: 5 });
  };
  const a = build(), b = build();
  const before = a.score, ra = finale(a), rb = finale(b);
  assert.deepEqual(ra.steps, rb.steps); assert.deepEqual(a, b);
  assert.equal(ra.steps[0].k, 'finale');
  assert.equal(a.spare, 5); assert.equal(a.moves, 0);
  assert.ok(!specials(a));
  assert.equal(a.score, before + ra.steps.filter(s => s.k === 'wave').reduce((n, s) => n + s.points, 0));
  assert.ok(ra.steps.some(s => s.k === 'convert'));
});
test('nothing to do: only the marker, score unchanged, spare 0', () => {
  const S = mk(plain(7), { goals: won1, moves: 0 });
  const before = S.score, r = finale(S);
  assert.deepEqual(r.steps, [{ k: 'finale' }]); assert.equal(S.score, before); assert.equal(S.spare, 0);
});
test('forty spare moves terminate with moves 0 and no specials', () => {
  const S = mk(plain(8), { goals: won1, moves: 40 });
  finale(S);
  assert.equal(S.moves, 0); assert.equal(S.spare, 40); assert.ok(!specials(S));
});
test('spare moves convert in rounds of FINALE_BATCH tiles at once', () => {
  const S = mk(plain(8), { goals: won1, moves: 20 });
  const conv = finale(S).steps.filter(s => s.k === 'convert');
  assert.deepEqual(conv.map(s => s.spent), [5, 5, 5, 5]);
  assert.equal(conv[0].cells.length, 5);
  assert.equal(new Set(conv[0].cells.map(c => c.i)).size, 5);
});
test('spare moves with no plain movable tile are skipped', () => {
  const S = mk(rows(3, (r, c) => (r + c) % 2 ? '#1' : 'A!'), { goals: won1, moves: 3 });
  assert.deepEqual(finale(S).steps, [{ k: 'finale' }, { k: 'convert', cells: [], spent: 3 }]);
  assert.equal(S.spare, 3); assert.equal(S.moves, 0);
});
test('finale refills are not damped', () => {
  let lined = 0;
  for (let seed = 1; seed <= 200; seed++) {
    const S = mk(plain(5), { k: 3, seed, goals: won1, moves: 3 });
    const steps = finale(S).steps;
    // a wave that fires nothing follows a fall only when a refill made a line
    if (steps.some((s, k) => s.k === 'wave' && !s.fired.length && steps[k - 1]?.k === 'fall')) lined++;
  }
  assert.ok(lined > 100);   // damped refills give about 40 of 200, undamped about 170
});
