import test from 'node:test';
import assert from 'node:assert/strict';
import { chapterOf, difficulty, breather, paramsFor, makeAttempt, GOAL, ENC_FROM, FW_FROM, MAX_LEVEL, clampLevel, boardFor, SHAPES_FROM, TP_FROM, DROP_FROM } from '../src/levels.js';
import { findGroups, hasMove, validSave, isSpawner } from '../src/core.js';
import { parse, TEMPLATES } from '../src/layouts.js';

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
  for (let salt = 0; salt < 10; salt++) {
    const F = makeAttempt(FW_FROM, 0, salt), E = makeAttempt(ENC_FROM, 0, salt);
    assert.ok(F.grid.some(x => x && x.lock) && F.goals.some(g => g.kind === 'firewall'), `fw salt ${salt}`);
    assert.ok(E.enc.some(Boolean) && E.goals.some(g => g.kind === 'crack'), `enc salt ${salt}`);
  }
});

test('layout and goals stay across deals and retries; tiles follow the deal', () => {
  const tiles = S => S.grid.map(x => x && x.t);
  const a = makeAttempt(12, 0, 0, 0, 0), b = makeAttempt(12, 2, 0, 0, 3), c = makeAttempt(12, 2, 0, 0, 0);
  assert.deepEqual(a.enc, b.enc);
  assert.deepEqual(a.goals, b.goals);
  assert.notDeepEqual(tiles(a), tiles(b));
  assert.deepEqual(tiles(a), tiles(c));   // same deal, same board (fails below 6 do not change it)
});

test('encrypted cells on square boards are mirrored and never seal a row', () => {
  for (let l = 4; l <= 120; l++) {
    const S = makeAttempt(l), n = S.n;
    if (S.cell || S.spawn) continue;
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

test('single-colour tiles goal is GOAL times the base size, times the template effort', () => {
  let seen = 0;
  for (let l = 1; l <= 60; l++) {
    const S = makeAttempt(l, 0, 0), tg = S.goals.filter(g => g.kind === 'tiles');
    if (tg.length !== 1) continue;
    const p = paramsFor(l, 0, 0), effort = TEMPLATES.find(t => t.name === S.board)?.effort ?? 1;
    assert.equal(tg[0].need, Math.round(effort * GOAL * (15 + 25 * p.d) * 5 / p.k), `level ${l}`);
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

test('level picker clamps to 1..max and falls back on junk', () => {
  assert.equal(MAX_LEVEL, 9999);
  assert.equal(clampLevel('7', 12, 3), 7);
  assert.equal(clampLevel('40', 12, 3), 12, 'never past the best level');
  assert.equal(clampLevel('0', 12, 3), 1);
  assert.equal(clampLevel('-5', 12, 3), 1);
  assert.equal(clampLevel('4.6', 12, 3), 4, 'whole levels only');
  assert.equal(clampLevel('abc', 12, 3), 3, 'junk keeps the fallback');
  assert.equal(clampLevel('', 12, 3), 3);
  assert.equal(clampLevel('12000', MAX_LEVEL, 3), MAX_LEVEL);
});

test('square levels without blockers unchanged', () => {
  // recorded from master before boards existed
  const master = {
    1: ['0020133124303041320433032130212044043011103200100033244232031342', { kind: 'tiles', t: 1, need: 18, got: 0 }],
    2: ['2202130123302434004142042232323304412331422102143103430211014132', { kind: 'tiles', t: 3, need: 19, got: 0 }],
    3: ['2334211241002234102003142403122010112341014301131143324204243030', { kind: 'tiles', t: 2, need: 20, got: 0 }],
  };
  for (const [l, [grid, goal]] of Object.entries(master)) {
    const S = makeAttempt(+l);
    assert.equal(S.grid.map(x => x.t).join(''), grid, `level ${l}`);
    assert.deepEqual(S.goals, [goal]);
  }
});

test('no templates before SHAPES_FROM; the first template level is a breather', () => {
  for (let l = 1; l < SHAPES_FROM; l++) assert.equal(boardFor(l).kind, 'square', `level ${l}`);
  assert.equal(boardFor(SHAPES_FROM).kind, 'template');
  assert.ok(breather(SHAPES_FROM));
  for (let l = 1; l <= 300; l++) assert.equal(boardFor(l, 2).kind, 'square');
});

test('templates mix in, more towards the end of a chapter', () => {
  const share = (a, b) => { let t = 0; for (let l = a; l <= b; l++) t += boardFor(l).kind === 'template'; return t / (b - a + 1) };
  const early = share(31, 45) + share(61, 75) + share(91, 105), late = share(46, 60) + share(76, 90) + share(106, 120);
  assert.ok(early > .3 && late > early, `early ${early / 3} late ${late / 3}`);
});

test('board depends on level only', () => {
  const l = SHAPES_FROM, a = makeAttempt(l), b = makeAttempt(l, 3, 2, 0.1, 4);
  assert.match(a.board, /^[a-z]+$/);
  for (const k of ['board', 'n', 'cell', 'spawn']) assert.deepEqual(b[k], a[k], k);
  assert.ok(validSave(a) && hasMove(a) && findGroups(a).length === 0);
});

test('lower-band fallback picks an easier template', () => {
  for (let l = SHAPES_FROM; l <= 120; l++) {
    const b = boardFor(l);
    if (b.kind !== 'template') continue;
    const f = boardFor(l, 1), band = name => TEMPLATES.find(t => t.name === name).dMin;
    assert.equal(f.kind, 'template');
    assert.ok(band(f.name) < band(b.name) || band(f.name) === Math.min(...TEMPLATES.map(t => t.dMin)), `level ${l}`);
    assert.equal(makeAttempt(l, 0, 0, 0, 0, 2).board.startsWith('square'), true);
  }
});

test('blockers stay in zones', () => {
  let seen = 0;
  for (let l = SHAPES_FROM; l <= 120; l++) {
    if (boardFor(l).kind !== 'template') continue;
    const S = makeAttempt(l), b = boardFor(l), t = TEMPLATES.find(x => x.name === b.name), zone = parse(t, b.mirror).zone;
    for (let i = 0; i < S.n * S.n; i++) {
      if (!S.enc[i] && !S.grid[i]?.lock) continue;
      seen++;
      assert.ok(zone.includes(i) && !isSpawner(S, i), `level ${l} cell ${i}`);
    }
    assert.ok(validSave(S) && hasMove(S), `level ${l}`);
  }
  assert.ok(seen > 20);
});

test('patterns on squares', () => {
  const seen = new Set();
  for (let l = ENC_FROM; l <= 120; l++) {
    const S = makeAttempt(l);
    if (S.cell || S.spawn || !S.goals.some(g => g.kind !== 'tiles')) continue;
    assert.match(S.board, /^square:(ring|wall|cross|diagonal|pairs)$/, `level ${l}`);
    seen.add(S.board);
  }
  assert.equal(seen.size, 5);
});

test('templates do not repeat within a few template levels; a flippable one flips on each use', () => {
  let last = [], side = {};
  for (let l = SHAPES_FROM; l <= 300; l++) {
    const b = boardFor(l);
    if (b.kind !== 'template') continue;
    if (l % 5 !== 0) assert.ok(!last.slice(0, 2).includes(b.name), `level ${l} ${b.name} after ${last}`);
    if (TEMPLATES.find(t => t.name === b.name).mirror) { if (b.name in side) assert.notEqual(b.mirror, side[b.name], `level ${l}`); side[b.name] = b.mirror }
    last.unshift(b.name);
  }
});

test('no teleporter templates before TP_FROM; TP_FROM is a breather with one', () => {
  const tele = l => { const b = boardFor(l); return b.kind === 'template' && TEMPLATES.find(t => t.name === b.name).tags.includes('teleport') };
  for (let l = 1; l < TP_FROM; l++) assert.ok(!tele(l), `level ${l}`);
  assert.ok(breather(TP_FROM) && tele(TP_FROM));
  let seen = 0;
  for (let l = TP_FROM; l <= 150; l++) if (tele(l)) {
    const S = makeAttempt(l);
    assert.ok(S.tp?.length && validSave(S) && hasMove(S), `level ${l}`);
    seen++;
  }
  assert.ok(seen >= 5, `${seen} teleporter levels`);
});

test('drop goals only from DROP_FROM, on drop templates; DROP_FROM is a breather with one', () => {
  const dropBoard = l => { const b = boardFor(l); return b.kind === 'template' && TEMPLATES.find(t => t.name === b.name).tags.includes('drop') };
  for (let l = 1; l < DROP_FROM; l++) assert.ok(!makeAttempt(l).goals.some(g => g.kind === 'drop') && !dropBoard(l), `level ${l}`);
  assert.ok(breather(DROP_FROM) && dropBoard(DROP_FROM));
  let seen = 0;
  for (let l = DROP_FROM; l <= 150; l++) {
    const S = makeAttempt(l), drops = S.goals.filter(g => g.kind === 'drop');
    assert.equal(drops.length > 0, dropBoard(l), `level ${l}`);
    if (!drops.length) { assert.ok(!S.exit && !S.drops, `level ${l}`); continue }
    seen++;
    assert.ok(S.exit.length && Number.isInteger(S.drops.every) && S.drops.wait === S.drops.every, `level ${l}`);
    assert.ok(drops.every(g => g.need >= 1 && g.need <= 4 && g.got === 0), `level ${l}`);
    assert.equal(new Set(drops.map(g => g.d)).size, drops.length, `level ${l}`);
    assert.ok(S.goals.length <= 3 && validSave(S) && hasMove(S), `level ${l}`);
    for (const s of S.spawn ?? []) if (s.d >= 0) assert.ok(drops.some(g => g.d === s.d), `level ${l} spawner kind ${s.d}`);
  }
  assert.ok(seen >= 5, `${seen} drop levels`);
});

test('a template\'s starting drops are placed', () => {
  // no library template starts with drops; place one on a copy of chute
  const t = TEMPLATES.find(x => x.name === 'chute'), saved = t.rows[1];
  t.rows[1] = '. . . D2 . . . .';
  try {
    const l = DROP_FROM, S = makeAttempt(l);
    assert.deepEqual(S.grid[11], { id: S.grid[11].id, t: -1, s: null, lock: false, d: 2 });
    assert.ok(S.goals.some(g => g.kind === 'drop' && g.d === 2) && S.drops.wait === 0 && validSave(S));
  } finally { t.rows[1] = saved }
});
