import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TEMPLATES, parse, check, exitDistance, MIN_SIDE, MAX_W, MAX_H } from '../src/layouts.js';

test('every template parses, both mirrors, and check() is empty', () => {
  assert.ok(TEMPLATES.length >= 7);
  for (const t of TEMPLATES) for (const m of [false, true]) assert.deepEqual(check(parse(t, m)), [], t.name + (m ? ' mirrored' : ''));
});

test('sides stay in the size caps, names are unique, bands lie in 0..1', () => {
  for (const t of TEMPLATES) {
    const { w, h } = parse(t);
    assert.ok(w >= MIN_SIDE && w <= MAX_W && h >= MIN_SIDE && h <= MAX_H, t.name);
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

test('split boards have an odd width, so the split sits in the middle', () => {
  for (const t of TEMPLATES.filter(t => t.tags.includes('split'))) assert.equal(parse(t).w % 2, 1, t.name);
});

test('check finds a half pair', () => {
  const rows = Array(7).fill('. . . . . . .');
  rows[3] = '. iA . . . . .';
  assert.ok(check(parse({ rows })).some(e => /pair/.test(e)));
  rows[3] = '. . . . . eB .';
  assert.ok(check(parse({ rows })).some(e => /pair/.test(e)));
});

test('check finds a loop', () => {
  // the egress near the top pulls from the ingress at the bottom of its own column
  const rows = Array(7).fill('. . . . . . .');
  rows[1] = 'eA . . . . . .';
  rows[6] = 'iA . . . . . .';
  assert.ok(check(parse({ rows })).some(e => /loop/.test(e)));
});

test('check finds an egress that also spawns', () => {
  const rows = Array(7).fill('. . . . . . .');
  rows[0] = '. . . . . . eA';
  rows[6] = 'iA . . . . . .';
  assert.ok(check(parse({ rows })).some(e => /spawn/.test(e)));
});

test('parse rejects a pair letter used twice', () => {
  const rows = Array(7).fill('. . . . . . .');
  rows[3] = 'iA iA . . . . eA';
  assert.throws(() => parse({ rows }));
});

test('teleporter templates: complete pairs, explicit spawners', () => {
  const tp = TEMPLATES.filter(t => t.tags.includes('teleport'));
  assert.ok(tp.length >= 3);
  for (const t of tp) { const L = parse(t); assert.ok(L.tp.length && L.spawn, t.name) }
});

test('check finds a drop spawner with no path', () => {
  // the block column cuts the left spawners off from the only drop point
  const rows = Array(7).fill('. . . # . . .');
  rows[0] = 'S S S # S S S';
  rows[6] = '. . . # . . X';
  assert.ok(check(parse({ rows })).some(e => /spawner \d+ never reaches/.test(e)));
  rows[2] = '. . . . . . .';   // a gap in the wall: a drop can be swapped across
  assert.deepEqual(check(parse({ rows })), []);
  rows[2] = '. D1 . # . . .';
  assert.ok(check(parse({ rows })).some(e => /drop \d+ never reaches/.test(e)));
});

test('drop templates: drop points, a schedule, the corner run and the mirrored funnel', () => {
  const drop = TEMPLATES.filter(t => t.tags.includes('drop'));
  assert.ok(drop.length >= 3);
  for (const t of drop) assert.ok(parse(t).exit.length && Number.isInteger(t.every), t.name);
  for (const t of TEMPLATES) if (!t.tags.includes('drop')) assert.equal(parse(t).exit.length, 0, t.name);
  const corner = parse(TEMPLATES.find(t => t.name === 'corner')), funnel = parse(TEMPLATES.find(t => t.name === 'funnel'));
  assert.deepEqual(corner.spawn, [{ i: 0, d: -1 }]);
  assert.deepEqual(corner.exit, [corner.n * corner.n - 1]);
  assert.deepEqual(funnel.spawn, [{ i: 0, d: 0 }, { i: 8, d: 1 }]);
  assert.deepEqual(funnel.exit, [75, 77]);
  assert.ok(funnel.tp.length >= 2);
});

test('exitDistance follows teleporters and swaps', () => {
  const L = parse(TEMPLATES.find(t => t.name === 'corner')), dist = exitDistance(L);
  assert.equal(dist[L.n * L.n - 1], 0);
  assert.equal(dist[0], 2 * (L.n - 1));   // swaps across the open board beat the run through every column
  const rows = Array(7).fill('. . . # . . .');
  rows[0] = 'S S S # eA . .'; rows[6] = 'iA . . # . . X';
  const T = parse({ rows }), d = exitDistance(T);
  assert.equal(d[42], 1 + 6 + 2);   // through the teleporter, down, then across
});

const rect = (w, h, edits = {}) => ({ name: 'r', rows: Array.from({ length: h }, (_, r) =>
  Array.from({ length: w }, (_, c) => edits[r + ',' + c] ?? (r === 0 ? 'S' : '.')).join(' ')) });

test('parse pads a non-square template', () => {
  const L = parse(rect(6, 9));
  assert.deepEqual([L.n, L.w, L.h], [9, 6, 9]);
  for (let i = 0; i < 81; i++) assert.equal(L.cell[i] === 1, i % 9 >= 6, String(i));
  assert.deepEqual(L.spawn.map(s => s.i), [0, 1, 2, 3, 4, 5]);
});

test('parse mirrors within the width', () => {
  const L = parse(rect(6, 9, { '8,0': 'iA', '0,5': 'eA' }), true);
  assert.deepEqual(L.tp, [[8 * 9 + 5, 0]]);
});

test('check: size per side', () => {
  for (const [w, h] of [[4, 9], [10, 9], [9, 12]]) assert.match(check(parse(rect(w, h)))[0], /^size /);
  for (const [w, h] of [[5, 11], [9, 11]]) assert.deepEqual(check(parse(rect(w, h))), []);
});
