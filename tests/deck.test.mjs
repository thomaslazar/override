import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ITEMS, STARTER, deckFrom, payout, lootFor, gearFor, buy, take, add } from '../src/deck.js';

test('payout', () => {
  assert.equal(payout(3870, null), 38);
  assert.equal(payout(5000, 3870), 11);
  assert.equal(payout(3000, 3870), 0);
  assert.equal(payout(99, null), 0);
});

test('deckFrom', () => {
  const ids = ITEMS.map(i => i.id);
  for (const bad of [undefined, null, 'x', 5]) {
    const d = deckFrom(bad);
    assert.equal(d.cred, 0);
    assert.deepEqual(Object.keys(d.items).sort(), [...ids].sort());
    for (const id of ids) assert.equal(d.items[id], STARTER[id] || 0);
  }
  const d = deckFrom({ cred: 40, items: { worm: 5, nope: 3 } });
  assert.equal(d.cred, 40);
  assert.equal(d.items.worm, 5);
  assert.equal(d.items.bomb, 0);
  assert.ok(!('nope' in d.items));
});

test('lootFor', () => {
  assert.equal(lootFor(7), lootFor(7));
  for (const l of [5, 30, 35, 60]) assert.ok(lootFor(l));
  let n = 0;
  for (let l = 1; l <= 300; l++) if (lootFor(l)) n++;
  assert.ok(n / 300 > .15 && n / 300 < .35, String(n / 300));
});

test('gearFor', () => {
  for (let l = 1; l <= 100; l++) {
    const g = gearFor(l);
    assert.deepEqual(g, gearFor(l));
    assert.equal(new Set(g.map(x => x.id)).size, 3);
    for (const x of g) {
      assert.ok(['worm', 'bomb', 'rocket', 'zero', 'moves'].includes(x.id));
      if (x.id === 'moves') assert.ok(x.n >= 3 && x.n <= 5);
    }
  }
});

test('buy and take', () => {
  const d = { cred: 100, items: { worm: 0 } };
  const price = ITEMS.find(i => i.id === 'worm').price;
  assert.equal(buy(d, 'worm'), true);
  assert.equal(d.cred, 100 - price);
  assert.equal(d.items.worm, 1);
  d.cred = price - 1;
  assert.equal(buy(d, 'worm'), false);
  assert.equal(d.items.worm, 1);
  assert.equal(take(d, 'worm'), true);
  assert.equal(take(d, 'worm'), false);
  add(d, 'bomb', 2);
  assert.equal(d.items.bomb, 2);
});

test('deckFrom keeps the valid fields', () => {
  const d = deckFrom({ cred: 40, items: { worm: 5, bomb: -2, rocket: 1.5, hammer: 3 } });
  assert.equal(d.cred, 40);
  assert.equal(d.items.worm, 5); assert.equal(d.items.bomb, 0); assert.equal(d.items.rocket, 0); assert.equal(d.items.hammer, 3);
  const e = deckFrom({ cred: -1, items: { worm: 4 } });
  assert.equal(e.cred, 0); assert.equal(e.items.worm, 4);
  const f = deckFrom({ cred: 7, items: 'x' });
  assert.equal(f.cred, 7);
  for (const { id } of ITEMS) assert.equal(f.items[id], 0);
});

test('buy refuses an unknown id', () => {
  const d = { cred: 1000, items: {} };
  assert.equal(buy(d, 'laser'), false);
  assert.equal(d.cred, 1000);
});
