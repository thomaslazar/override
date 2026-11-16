import test from 'node:test';
import assert from 'node:assert/strict';
import { findGroups, move, swapLegal, gravity, reshuffle, finale, validMoves, validSave, toSave, tile, SCORE, DROP_KINDS } from '../src/core.js';
import { mk } from './helpers.mjs';

// Rows of a match-free n x n board (colours A..E), with tokens replaced: edits = { 'r,c': token }.
const board = (n, edits = {}) => Array.from({ length: n }, (_, r) =>
  Array.from({ length: n }, (_, c) => edits[r + ',' + c] ?? 'ABCDE'[(r * 2 + c) % 5]).join(' '));
const dropGoal = (d, need) => ({ kind: 'drop', d, need, got: 0 });
const dropsOn = S => S.grid.filter(x => x && x.d !== undefined);
const isDrop = x => !!x && x.d !== undefined;

test('mk reads drop tiles, drop points and the schedule', () => {
  const S = mk(['D0 D1X .X', 'A B C', 'B C A'], { drops: { every: 0, wait: 0 } });
  assert.equal(DROP_KINDS, 3);
  assert.deepEqual(S.grid[0], { id: 0, t: -1, s: null, lock: false, d: 0 });
  assert.equal(S.grid[1].d, 1);
  assert.equal(S.grid[2], null);
  assert.deepEqual(S.exit, [1, 2]);
  assert.deepEqual(S.drops, { every: 0, wait: 0 });
});

test('drop tiles never match', () => {
  const S = mk(board(5, { '0,0': 'D0', '0,1': 'D0', '0,2': 'D0' }));
  assert.equal(findGroups(S).length, 0);
});

// Row 2: F F drop C D; an F above the drop at (1,2).
const swapBoard = (edits = {}) => mk(board(5, { '2,0': 'F', '2,1': 'F', '1,2': 'F', '2,2': 'D0', ...edits }));

test('swap rule: a drop swaps only when the other tile makes a line', () => {
  for (const [a, b] of [[7, 12], [12, 7]]) {
    const S = swapBoard(), id = S.grid[12].id;
    assert.ok(swapLegal(S, a, b));
    const { ok, steps } = move(S, a, b);
    assert.ok(ok);
    assert.equal(S.moves, 29);
    assert.ok(steps.some(s => s.k === 'fall' && s.moves.some(m => m.id === id && m.from === 7)), 'the drop moved up, then fell');
    assert.equal(dropsOn(S).length, 1);
  }
  const S = swapBoard();
  assert.equal(swapLegal(S, 12, 13), false);   // C into (2,2) makes no line
  const before = S.grid.slice();
  const r = move(S, 12, 13);
  assert.equal(r.ok, false);
  assert.deepEqual(S.grid, before);
  assert.equal(S.moves, 30);
});

test('swap rule: drop with drop never swaps', () => {
  const S = swapBoard({ '2,3': 'D1' });
  assert.equal(swapLegal(S, 12, 13), false);
  assert.equal(move(S, 12, 13).ok, false);
});

test('swap rule: a worm or bomb swapped with a drop fires (no combo); a zero-day needs a match', () => {
  const S = swapBoard({ '1,2': 'Fh' });
  assert.ok(swapLegal(S, 7, 12));
  const { ok, steps } = move(S, 7, 12);
  assert.ok(ok);
  assert.ok(!steps.some(s => s.k === 'combo'));
  assert.ok(steps.find(s => s.k === 'wave').fired.some(f => f.s === 'h'));
  assert.equal(dropsOn(S).length, 1);
  for (const sp of ['Ch', 'Cb']) {
    const T = swapBoard({ '3,2': sp });   // the special lands at (2,2): no line, it fires anyway
    assert.ok(swapLegal(T, 17, 12), sp);
    const r = move(T, 17, 12);
    assert.ok(r.ok, sp);
    assert.equal(T.moves, 29, sp);
    assert.ok(!r.steps.some(s => s.k === 'combo'), sp);
    assert.equal(r.steps.find(s => s.k === 'wave').fired[0].s, sp[1], sp);
    assert.equal(dropsOn(T).length, 1, sp);
  }
  const T = swapBoard({ '3,2': 'Z' });
  assert.equal(swapLegal(T, 17, 12), false);
  const r = move(T, 17, 12);
  assert.equal(r.ok, false);
  assert.ok(!r.steps.some(s => s.k === 'combo' || s.k === 'wave'));
});

test('a second tap fires a worm or bomb in place for one move; zero-days, locked and plain tiles do not', () => {
  for (const sp of ['Ah', 'Av', 'Ab']) {
    const S = mk(board(5, { '2,2': sp }));
    const r = move(S, 12, 12);
    assert.ok(r.ok, sp);
    assert.equal(S.moves, 29, sp);
    assert.deepEqual(r.steps[0].fired, [{ i: 12, s: sp[1] }], sp);
  }
  for (const tok of ['Z', 'Ah!', 'A']) {
    const S = mk(board(5, { '2,2': tok }));
    assert.equal(move(S, 12, 12).ok, false, tok);
    assert.equal(S.moves, 30, tok);
  }
  const S = mk(board(5, { '2,2': 'Ah' }), { moves: 0 });
  assert.equal(move(S, 12, 12).ok, false);
});

test('no wave clears a drop', () => {
  const cases = [
    [{ '1,1': 'Ah', '2,4': 'D0' }, 6, 11],          // worm fires along row 2
    [{ '1,1': 'Ab', '3,2': 'D0' }, 6, 11],          // bomb fires around (2,1)
    [{ '1,1': 'Z', '4,4': 'D0' }, 6, 11],           // zero-day takes column colour A
    [{ '1,1': 'Z', '2,1': 'Z', '4,4': 'D0' }, 6, 11] // zero-day + zero-day clears everything else
  ];
  for (const [edits, a, b] of cases) {
    const S = mk(board(5, edits)), id = S.grid.find(isDrop).id;
    const { ok, steps } = move(S, a, b);
    assert.ok(ok, JSON.stringify(edits));
    assert.ok(steps.filter(s => s.k === 'wave').every(w => w.cleared.every(c => c.id !== id)), JSON.stringify(edits));
    assert.equal(dropsOn(S).length, 1);
    assert.equal(dropsOn(S)[0].id, id);
  }
});

test('a zero-day fired by a blast never targets drops', () => {
  // drops, a worm, a zero-day and one plain tile: the zero-day must take a real colour
  const S = mk(['Z D1 D2', 'Av D0 D1', 'B D0 D2']);
  const { steps } = move(S, 3, 6);   // the worm drops to (2,0) and fires column 0, hitting the zero-day
  assert.equal(dropsOn(S).length, 6);
  assert.ok(steps.some(s => s.k === 'wave' && s.fired.some(f => f.s === 'z')));
});

test('drop leaves at a drop point', () => {
  const S = mk(['A D0 B', 'B . C', 'C .X A'], { goals: [dropGoal(0, 1)] });
  const id = S.grid[1].id, steps = [];
  gravity(S, steps);
  const ex = steps.find(s => s.k === 'exit');
  assert.deepEqual(ex, { k: 'exit', i: 7, id, d: 0, points: SCORE.exit, got: [1] });
  assert.equal(SCORE.exit, 200);
  assert.equal(S.goals[0].got, 1);
  assert.equal(S.score, 200);
  assert.ok(S.grid[7] && !isDrop(S.grid[7]), 'the drop point refilled');
  assert.equal(dropsOn(S).length, 0);
  assert.ok(steps.indexOf(ex) < steps.length - 1, 'gravity continued after the exit');
});

// A board with one easy move: swap (1,2) up makes F F F in row 0.
const easy = edits => board(5, { '0,0': 'F', '0,1': 'F', '1,2': 'F', ...edits });

test('drop on a drop point at the start leaves at the next settle', () => {
  const S = mk(easy({ '4,2': 'D0X' }), { goals: [dropGoal(0, 1)] });
  const { ok, steps } = move(S, 7, 2);
  assert.ok(ok);
  assert.ok(steps.some(s => s.k === 'exit' && s.i === 22));
  assert.equal(S.goals[0].got, 1);
});

test('drop on a drop point after a reshuffle leaves at the next settle', () => {
  const S = mk(easy({ '4,2': 'D0X' }), { goals: [dropGoal(0, 1), { kind: 'tiles', t: 0, need: 99, got: 0 }] });
  reshuffle(S, []);
  assert.equal(S.grid[22].d, 0);
  const [a, b] = validMoves(S)[0];
  const { ok, steps } = move(S, a, b);
  assert.ok(ok);
  assert.ok(steps.some(s => s.k === 'exit' && s.i === 22));
});

// Plays the first legal move; returns the number of drops on the board after it.
const play = S => { const [a, b] = validMoves(S)[0]; assert.ok(move(S, a, b).ok); return dropsOn(S).length };
const goals = (...g) => [...g, { kind: 'tiles', t: 0, need: 999, got: 0 }];

test('schedule after: the next drop spawns only when none is on the board', () => {
  const S = mk(easy({}), { goals: goals(dropGoal(0, 2)), drops: { every: 0, wait: 0 } });
  assert.equal(play(S), 1);
  assert.equal(play(S), 1);
  assert.equal(play(S), 1);
  // the drop leaves (by hand): the next refill brings the second
  const i = S.grid.findIndex(isDrop);
  S.grid[i] = tile(S, 0); S.goals[0].got = 1;
  assert.equal(play(S), 1);
  // and never more than the goal still needs
  S.grid[S.grid.findIndex(isDrop)] = tile(S, 0); S.goals[0].got = 2;
  for (let k = 0; k < 4; k++) assert.equal(play(S), 0);
});

test('schedule every 3: one drop every 3 moves', () => {
  const S = mk(easy({}), { goals: goals(dropGoal(0, 5)), drops: { every: 3, wait: 0 } });
  assert.deepEqual(Array.from({ length: 6 }, () => play(S)), [0, 0, 1, 1, 1, 2]);
});

test('never more drops on the board than the goals still need', () => {
  const S = mk(easy({}), { goals: goals(dropGoal(0, 1), dropGoal(2, 1)), drops: { every: 1, wait: 0 } });
  const counts = Array.from({ length: 8 }, () => play(S));
  assert.ok(counts.every(c => c <= 2));
  assert.equal(counts[counts.length - 1], 2);
  assert.deepEqual(dropsOn(S).map(x => x.d).sort(), [0, 2]);
});

test('a kind-limited spawner spawns only its kind', () => {
  const S = mk(easy({}), { goals: goals(dropGoal(0, 3), dropGoal(1, 3)), drops: { every: 1, wait: 0 } });
  S.spawn = [0, 1, 2, 3, 4].map(i => ({ i, d: 1 }));
  for (let k = 0; k < 6; k++) play(S);
  assert.ok(dropsOn(S).length > 0);
  assert.ok(dropsOn(S).every(x => x.d === 1));
});

test('reshuffle leaves drops in place', () => {
  const S = mk(board(5, { '0,0': 'D0', '2,3': 'D1', '4,4': 'D2' }));
  const before = [0, 13, 24].map(i => S.grid[i]);
  reshuffle(S, []);
  assert.deepEqual([0, 13, 24].map(i => S.grid[i]), before);
});

test('finale leaves drops', () => {
  const S = mk(board(5, { '0,0': 'D0', '2,3': 'D1', '4,4': 'D2', '1,1': 'Ab' }),
    { goals: [{ kind: 'tiles', t: 0, need: 1, got: 1 }], moves: 8 });
  const ids = dropsOn(S).map(x => x.id).sort();
  finale(S);
  assert.deepEqual(dropsOn(S).map(x => x.id).sort(), ids);
  assert.ok(dropsOn(S).every(x => x.s === null && x.t === -1));
});

test('validSave accepts drops, drop points, schedule and drop goals', () => {
  const S = mk(board(7, { '0,0': 'D0', '6,3': '.X' }), { goals: [dropGoal(0, 2), dropGoal(1, 1)], drops: { every: 3, wait: 1 } });
  const o = toSave(S);
  assert.ok(validSave(o));
  const g = o.grid;
  for (const bad of [{ grid: g.map((x, i) => i ? x : { ...x, t: 0 }) }, { grid: g.map((x, i) => i ? x : { ...x, d: 3 }) },
    { grid: g.map((x, i) => i ? x : { ...x, s: 'h' }) }, { grid: g.map((x, i) => i ? x : { ...x, lock: true }) },
    { grid: g.map((x, i) => i !== 1 ? x : { ...x, d: 0 }) },
    { exit: [49] }, { exit: [3, 3] }, { exit: 'x' }, { exit: [3], cell: Array(49).fill(0).map((_, i) => i === 3 ? 1 : 0), grid: g.map((x, i) => i === 3 ? null : x) },
    { drops: { every: -1, wait: 0 } }, { drops: { every: 3 } }, { drops: 3 },
    { goals: [dropGoal(3, 1)] }, { goals: [{ kind: 'drop', need: 1, got: 0 }] }])
    assert.equal(validSave({ ...o, ...bad }), false, JSON.stringify(bad).slice(0, 80));
});

test('a drop leaves as soon as it lands on a drop point, while the rest still falls', () => {
  const S = mk(board(5, { '3,0': 'D0', '4,0': '.X', '0,4': '.', '1,4': '.', '2,4': '.', '3,4': '.' }), { goals: [dropGoal(0, 1)] });
  const steps = [];
  gravity(S, steps);
  const ex = steps.findIndex(s => s.k === 'exit');
  assert.equal(ex, 1, steps.map(s => s.k).join());
  assert.ok(steps.slice(ex).some(s => s.k === 'fall'));
  assert.equal(S.goals[0].got, 1);
});
