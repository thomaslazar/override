import test from 'node:test';
import assert from 'node:assert/strict';
import { solve, pick, limitFor, prepare, search, CAP } from '../src/bot.js';
import { makeAttempt, boardFor, difficulty } from '../src/levels.js';
import { validSave, rngFor } from '../src/core.js';
import { TEMPLATES } from '../src/layouts.js';

test('limit eases from the 4th fail, capped at +40%', () => {
  assert.equal(limitFor(20, 0), Math.ceil(20 * 1.3 + 2));
  assert.equal(limitFor(20, 3), limitFor(20, 0));
  assert.equal(limitFor(20, 4), Math.ceil((20 * 1.3 + 2) * 1.1));
  assert.equal(limitFor(20, 20), Math.ceil((20 * 1.3 + 2) * 1.4));
  assert.equal(limitFor(2, 0), 10);
  assert.equal(limitFor(2, 4), 11);
});

test('solve is deterministic and does not touch its input', () => {
  const S = makeAttempt(5), copy = JSON.stringify(S);
  assert.equal(solve(S, 1), solve(S, 1));
  assert.equal(JSON.stringify(S), copy);
});

test('levels 1 to 60 are prepared, valid and beatable within the limit', () => {
  const t0 = Date.now();
  for (let l = 1; l <= 60; l++) {
    const S = prepare(l);
    assert.ok(validSave(S), `level ${l}`);
    assert.ok(Number.isFinite(S.need) && S.need <= CAP, `level ${l} need ${S.need}`);
    assert.ok(S.limit >= S.need && S.moves === S.limit, `level ${l}`);
    assert.equal(S.nice, true);
  }
  console.log(`prepared 60 levels in ${Date.now() - t0} ms`);
});

test('pick never reads the future refills: the seed does not change the move', () => {
  for (const l of [1, 10, 25]) {
    const S1 = makeAttempt(l), S2 = JSON.parse(JSON.stringify(S1));
    S2.seed = S1.seed + 12345;
    assert.deepEqual(pick(S1, rngFor(1, 19)), pick(S2, rngFor(1, 19)), `level ${l}`);
  }
});

test('a retry never gets fewer moves than the first try, and easing adds', () => {
  for (const l of [5, 17, 30]) {
    const base = prepare(l, 0).limit;
    for (let f = 1; f <= 6; f++) assert.ok(prepare(l, f).limit >= base, `level ${l} fails ${f}`);
    assert.ok(prepare(l, 4).limit > base, `level ${l} easing`);
  }
});

test('a retry keeps the level layout and goals', () => {
  const locks = S => S.grid.flatMap((x, i) => x && x.lock ? [i] : []);
  for (let l = 55; l <= 60; l++) {
    const b = prepare(l, 0);
    for (let f = 1; f <= 6; f++) {
      const S = prepare(l, f), id = `level ${l} fails ${f}`;
      assert.equal(S.salt, b.salt, id); assert.equal(S.drop, b.drop, id); assert.equal(S.n, b.n, id);
      assert.deepEqual(S.enc, b.enc, id); assert.deepEqual(locks(S), locks(b), id);
      assert.deepEqual(S.goals, b.goals, id); assert.ok(S.limit >= b.limit, id);
    }
  }
});

test('every deal of a level gets the same move limit and its own board', () => {
  for (const l of [3, 12, 25]) {
    const boards = new Set(), limits = new Set();
    for (let p = 0; p < 10; p++) { const S = prepare(l, 0, p); limits.add(S.limit); boards.add(S.grid.map(x => x?.t).join()) }
    assert.equal(limits.size, 1, `level ${l} limits`);
    assert.ok(boards.size >= 8, `level ${l} boards ${boards.size}`);
  }
});

test('bot wins template levels on their own template', () => {
  for (const l of [11, 19, 25, 30, 58]) {
    const S = prepare(l);
    assert.equal(boardFor(l).kind, 'template', `level ${l}`);
    assert.equal(S.board, boardFor(l).name, `level ${l}`);
    // finished, and near the effort target 8 + 14 d (spikes may run over)
    assert.ok(Number.isFinite(S.need) && S.need <= 1.5 * (8 + 14 * difficulty(l)), `level ${l} need ${S.need}`);
  }
});

test('fallback order: drop on the own template up to 0.5, then a lower template, then a square', () => {
  const tried = [];
  const f = search(25, S => { tried.push(`${S.board} ${S.drop}`); return Infinity });
  const seen = [...new Set(tried)], own = boardFor(25).name, low = boardFor(25, 1).name;
  assert.equal(seen[0], `${own} 0`);
  assert.equal(seen.indexOf(`${own} 0.5`) + 1, seen.indexOf(`${low} 0`));
  assert.ok(!seen.includes(`${own} 0.6`) && !seen.includes(`${low} 0.6`));
  assert.ok(seen.indexOf(`${low} 0.5`) < seen.findIndex(x => x.startsWith('square')));
  assert.equal(f.fb, 2);
  // a passing run stops at the first board
  assert.equal(search(25, () => 20).fb, 0);
});

test('bot finishes drop levels on their own template', () => {
  const levels = [];
  for (let l = 21; l <= 150 && levels.length < 4; l++) if (TEMPLATES.find(t => t.name === boardFor(l).name)?.tags.includes('drop') && !levels.some(x => boardFor(x).name === boardFor(l).name)) levels.push(l);
  assert.ok(levels.length >= 3, `${levels}`);
  for (const l of levels) {
    const S = prepare(l);
    assert.equal(S.board, boardFor(l).name, `level ${l}`);
    assert.ok(S.goals.some(g => g.kind === 'drop'), `level ${l}`);
    assert.ok(Number.isFinite(S.need) && S.need < CAP, `level ${l} need ${S.need}`);
  }
});
