import test from 'node:test';
import assert from 'node:assert/strict';
import { solve, pick, limitFor, prepare, CAP } from '../src/bot.js';
import { makeAttempt } from '../src/levels.js';
import { validSave, rngFor } from '../src/core.js';

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
