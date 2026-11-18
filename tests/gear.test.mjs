import test from 'node:test';
import assert from 'node:assert/strict';
import { applyGear, tool, findGroups, won, validSave, toSave } from '../src/core.js';
import { mk } from './helpers.mjs';

// no line, no square; the D0 drop, the firewalled Cb!, the special Ah and #2 must stay untouched by gear
const board = () => mk([
  'A B C D E',
  'B C D E A',
  'C D0 E A B',
  'D E Ah #2 C',
  'E A B C! D',
]);
const SPECIALS = ['worm', 'bomb', 'rocket', 'zero'];
const GEAR = [...SPECIALS.map(id => ({ id })), { id: 'moves', n: 4 }];

test('applyGear turns plain tiles into the gear specials, keeping colour, making no match', () => {
  const S = board(), before = S.grid.map(x => x && { ...x });
  applyGear(S, GEAR);
  const changed = S.grid.map((x, i) => i).filter(i => S.grid[i]?.s !== before[i]?.s);
  assert.equal(changed.length, 4);
  for (const i of changed) {
    const b = before[i];
    assert.ok(b && !b.s && !b.lock && b.d === undefined && !S.enc[i], 'a plain tile');
    assert.equal(S.grid[i].id, b.id);
    if (S.grid[i].s === 'z') assert.equal(S.grid[i].t, -1);
    else assert.equal(S.grid[i].t, b.t);
  }
  assert.deepEqual(changed.map(i => S.grid[i].s).map(s => s === 'h' || s === 'v' ? 'w' : s).sort(), ['b', 'r', 'w', 'z']);
  assert.equal(findGroups(S).length, 0);
  assert.equal(S.moves, 34); assert.equal(S.limit, 34);
  assert.deepEqual(S.gear, ['worm', 'bomb', 'rocket', 'zero', 'moves']);
  assert.ok(validSave(toSave(S)));
  assert.ok(!validSave({ ...toSave(S), gear: ['laser'] }));
});

test('applyGear: same seed, same cells', () => {
  const A = board(), B = board();
  applyGear(A, GEAR); applyGear(B, GEAR);
  assert.deepEqual(A.grid, B.grid);
});

test('applyGear places only as many specials as there are plain tiles', () => {
  const S = mk(['Ah Bv Cb', 'D0 A! Bb', 'Cr D Er']);
  applyGear(S, [{ id: 'worm' }, { id: 'bomb' }]);
  assert.equal(S.grid[7].s === 'h' || S.grid[7].s === 'v' || S.grid[7].s === 'b', true);
  assert.equal(S.grid.filter(x => x && x.s).length, 7);
});

test('hammer clears a goal tile and counts it; no move spent', () => {
  const S = board(); S.goals = [{ kind: 'tiles', t: 0, need: 9, got: 0 }];
  const r = tool(S, 'hammer', 0);
  assert.ok(r.ok);
  assert.ok(S.goals[0].got >= 1);
  assert.equal(S.moves, 30);
  assert.ok(r.steps.some(s => s.k === 'wave' && s.cleared.length));
});

test('hammer unlocks a firewall, cracks one layer, fires a special', () => {
  let S = board(); S.goals = [{ kind: 'firewall', need: 1, got: 0 }];
  const id = S.grid[23].id;
  assert.ok(tool(S, 'hammer', 23).ok);
  assert.equal(S.grid[23].id, id); assert.equal(S.grid[23].lock, false); assert.equal(S.goals[0].got, 1);
  S = board();
  assert.ok(tool(S, 'hammer', 18).ok);
  assert.equal(S.enc[18], 1);
  S = board();
  const r = tool(S, 'hammer', 17);
  assert.deepEqual(r.steps.find(s => s.k === 'wave').fired.map(f => f.s), ['h']);
});

test('hammer refuses a drop, a hole and an empty cell', () => {
  const S = mk(['A B o', 'B . C', 'C D0 A']), snap = JSON.stringify(S);
  for (const i of [7, 2, 4]) assert.equal(tool(S, 'hammer', i).ok, false);
  assert.equal(JSON.stringify(S), snap);
});

test('a hammer that completes the goals wins', () => {
  const S = board(); S.goals = [{ kind: 'tiles', t: 0, need: 1, got: 0 }];
  assert.ok(tool(S, 'hammer', 0).ok);
  assert.ok(won(S));
});

test('swap moves a drop across without a match and it stays', () => {
  const S = board(), id = S.grid[11].id;
  const r = tool(S, 'swap', 11, 10);
  assert.ok(r.ok);
  assert.equal(S.grid[10].id, id);
  assert.equal(S.moves, 30);
  assert.ok(r.steps.some(s => s.k === 'swap') && !r.steps.some(s => s.k === 'back'));
});

test('swap of two specials resolves the combo', () => {
  const S = mk(['A B C D', 'Ah Bv D C', 'C D A B', 'D C B A']);
  const r = tool(S, 'swap', 4, 5);
  assert.ok(r.ok);
  assert.ok(r.steps.some(s => s.k === 'combo' && s.kind === 'ww'));
  assert.equal(S.moves, 30);
});

test('swap refuses a firewalled tile and non-neighbours', () => {
  const S = board(), snap = JSON.stringify(S);
  assert.equal(tool(S, 'swap', 23, 22).ok, false);
  assert.equal(tool(S, 'swap', 0, 2).ok, false);
  assert.equal(JSON.stringify(S), snap);
});

test('shuffle keeps drops and spends no move', () => {
  const S = board(), id = S.grid[11].id;
  const r = tool(S, 'shuffle');
  assert.ok(r.ok && r.steps.some(s => s.k === 'shuffle'));
  assert.equal(S.grid[11].id, id);
  assert.equal(S.moves, 30);
});

test('every tool refuses at 0 moves and after a win', () => {
  for (const set of [S => { S.moves = 0 }, S => { S.goals[0].got = S.goals[0].need }]) {
    const S = board(); set(S);
    const snap = JSON.stringify(S);
    for (const [k, a, b] of [['hammer', 0], ['swap', 0, 1], ['shuffle']]) assert.equal(tool(S, k, a, b).ok, false);
    assert.equal(JSON.stringify(S), snap);
  }
});
