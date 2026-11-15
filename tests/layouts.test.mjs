import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TEMPLATES, parse, check } from '../src/layouts.js';

test('every template parses, both mirrors, and check() is empty', () => {
  assert.ok(TEMPLATES.length >= 7);
  for (const t of TEMPLATES) for (const m of [false, true]) assert.deepEqual(check(parse(t, m)), [], t.name + (m ? ' mirrored' : ''));
});

test('n stays 7 to 9, names are unique, bands lie in 0..1', () => {
  for (const t of TEMPLATES) {
    const n = parse(t).n;
    assert.ok(n >= 7 && n <= 9, t.name);
    assert.ok(0 <= t.dMin && t.dMin < t.dMax && t.dMax <= 1, t.name);
  }
  assert.equal(new Set(TEMPLATES.map(t => t.name)).size, TEMPLATES.length);
});

test('check finds an unreachable cell', () => {
  const rows = Array(7).fill('. . . . . . .');
  rows[2] = '. . # # # . .';
  rows[3] = '. . # . # . .';
  assert.ok(check(parse({ rows })).length > 0);
});

test('mirror flips columns', () => {
  const rows = Array(7).fill('. . . . . . .');
  rows[0] = 'o . . . . . S';
  rows[3] = '. z . . . . .';
  const a = parse({ rows }), b = parse({ rows }, true);
  assert.equal(a.cell[0], 1); assert.equal(b.cell[0], 0); assert.equal(b.cell[6], 1);
  assert.deepEqual(b.spawn, [{ i: 0, d: -1 }]);
  assert.deepEqual(b.zone, [3 * 7 + 5]);
});

test('parse reads every token', () => {
  const rows = Array(7).fill('. . . . . . .');
  rows[0] = 'S0 S . . . . .';
  rows[1] = 'iA . . . . . eA';
  rows[6] = 'D2 . . X . . .';
  const L = parse({ rows });
  assert.deepEqual(L.spawn, [{ i: 0, d: 0 }, { i: 1, d: -1 }]);
  assert.deepEqual(L.tp, [[7, 13]]);
  assert.deepEqual(L.exit, [45]);
  assert.deepEqual(L.drops, [{ i: 42, d: 2 }]);
  assert.ok(!L.zone.includes(0) && !L.zone.includes(7) && !L.zone.includes(45) && !L.zone.includes(42) && L.zone.includes(8));
  assert.equal(L.cell, undefined);
});

test('split boards have an odd size, so the split sits in the middle', () => {
  for (const t of TEMPLATES.filter(t => t.tags.includes('split'))) assert.equal(t.rows.length % 2, 1, t.name);
});
