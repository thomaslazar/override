import test from 'node:test';
import assert from 'node:assert/strict';
import { chapterOf, difficulty, breather, paramsFor, makeAttempt, GOAL, ENC_FROM, FW_FROM } from '../src/levels.js';
import { findGroups, hasMove, validSave } from '../src/core.js';

test('chapters are 30 levels', () => {
  assert.deepEqual(chapterOf(1), { n: 1, start: 1, pos: 1 });
  assert.deepEqual(chapterOf(30), { n: 1, start: 1, pos: 30 });
  assert.deepEqual(chapterOf(31), { n: 2, start: 31, pos: 1 });
});

test('difficulty ramps per chapter with a five-level wave', () => {
  for (let l = 1; l <= 300; l++) { const d = difficulty(l); assert.ok(d >= 0 && d <= 1, `level ${l}`) }
  assert.ok(difficulty(29) > difficulty(2));
  assert.ok(difficulty(31) < difficulty(30), 'chapter resets');
  assert.ok(difficulty(31) >= difficulty(1));
  assert.ok(breather(6) && !breather(1) && !breather(5));
  assert.ok(difficulty(6) < difficulty(5));
});

test('parameters stay in range and ease with fails', () => {
  for (let l = 1; l <= 300; l++) {
    const p = paramsFor(l);
    assert.ok(p.n >= 7 && p.n <= 9 && p.k >= 4 && p.k <= 6 && p.hp >= 1 && p.hp <= 3, `level ${l}`);
    if (l < ENC_FROM) assert.equal(p.enc, 0);
    if (l < FW_FROM) assert.equal(p.fw, 0);
    assert.ok(paramsFor(l, 6).k === Math.max(4, p.k - 1));
  }
  assert.ok([...Array(300)].some((_, i) => paramsFor(i + 1).k === 6));
});

test('attempts are deterministic, valid and playable', () => {
  for (const l of [1, 2, 3, 4, 7, 12, 25, 30, 31, 58]) {
    const a = makeAttempt(l), b = makeAttempt(l);
    assert.deepEqual(a, b);
    assert.ok(validSave(a), `level ${l} valid`);
    assert.equal(findGroups(a).length, 0);
    assert.ok(hasMove(a));
    assert.ok(a.goals.length >= 1 && a.goals.length <= 3);
  }
});

test('first levels have tile goals only; blockers arrive on schedule', () => {
  for (const l of [1, 2, 3]) {
    const S = makeAttempt(l);
    assert.ok(S.goals.every(g => g.kind === 'tiles'));
    assert.ok(S.enc.every(x => !x) && S.grid.every(x => !x || !x.lock));
  }
  assert.ok(Array.from({ length: 10 }, (_, i) => makeAttempt(ENC_FROM + i)).some(S => S.enc.some(Boolean)));
  assert.ok(Array.from({ length: 10 }, (_, i) => makeAttempt(FW_FROM + i)).some(S => S.grid.some(x => x && x.lock)));
});

test('layout and goals stay on retry; tiles reshuffle', () => {
  const a = makeAttempt(12, 0), b = makeAttempt(12, 2);
  assert.deepEqual(a.enc, b.enc);
  assert.deepEqual(a.goals, b.goals);
  assert.notDeepEqual(a.grid.map(x => x && x.t), b.grid.map(x => x && x.t));
});

test('encrypted cells are mirrored and never seal a row', () => {
  for (let l = 4; l <= 120; l++) {
    const S = makeAttempt(l), n = S.n;
    for (let r = 0; r < n; r++) {
      const row = S.enc.slice(r * n, r * n + n);
      assert.ok(row.filter(Boolean).length <= n - 2, `level ${l} row ${r}`);
      assert.deepEqual(row, row.slice().reverse(), `level ${l} row ${r} mirrored`);
    }
    assert.ok(S.enc.slice(0, 2 * n).every(x => !x), 'top two rows stay free');
    const crack = S.goals.find(g => g.kind === 'crack');
    if (crack) assert.equal(crack.need, S.enc.filter(Boolean).length);
  }
});

test('goals stay the same when easing drops a colour', () => {
  const ls = [12, 25, 29, 58, ...Array.from({ length: 120 }, (_, i) => i + 1).filter(l => paramsFor(l).k >= 5)];
  for (const l of ls) {
    const a = makeAttempt(l, 0), b = makeAttempt(l, 6);
    assert.deepEqual(b.goals, a.goals, `level ${l}`);
    assert.ok(b.goals.every(g => g.kind !== 'tiles' || g.t < b.k), `level ${l} colour`);
  }
});

test('blockers only with their goal, at least one goal', () => {
  for (let l = 1; l <= 60; l++) {
    const S = makeAttempt(l, 0, 0), kinds = S.goals.map(g => g.kind);
    assert.ok(S.goals.length >= 1, `level ${l} has a goal`);
    assert.equal(S.enc.some(Boolean), kinds.includes('crack'), `crack ${l}`);
    assert.equal(S.grid.some(t => t && t.lock), kinds.includes('firewall'), `firewall ${l}`);
  }
});

test('single-colour tiles goal is GOAL times the base size', () => {
  let seen = 0;
  for (let l = 1; l <= 60; l++) {
    const S = makeAttempt(l, 0, 0), tg = S.goals.filter(g => g.kind === 'tiles');
    if (tg.length !== 1) continue;
    const p = paramsFor(l, 0, 0);
    assert.equal(tg[0].need, Math.round(GOAL * (15 + 25 * p.d) * 5 / p.k));
    seen++;
  }
  assert.ok(seen > 5);
});

test('layout and goals stay the same across fails', () => {
  for (const l of [4, 12, 25, 37, 50]) {
    const a = makeAttempt(l, 0, 3), b = makeAttempt(l, 3, 3);
    assert.deepEqual(a.enc, b.enc);
    assert.deepEqual(a.goals, b.goals);
    assert.deepEqual(a.grid.map(t => !!(t && t.lock)), b.grid.map(t => !!(t && t.lock)));
  }
});
