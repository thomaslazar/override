# Level Score and Finale Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A level score counted in the core, a seeded finale that fires leftover specials and spare moves after a win, best scores per level, and a win screen that shows them.

**Architecture:** Score is added inside `wave()` in `src/core.js` (each wave step carries `points`); `finale(S)` is a new pure, seeded core function returning steps like `move`. The UI calls it right after a winning move, saves, animates it (sped up, skippable), keeps best scores in `override-best`, and shows score and best on the win sheet.

**Tech Stack:** Vanilla ES modules, canvas, `node --test`. No dependencies, no build.

**Spec:** `docs/superpowers/specs/2026-11-13-score-and-finale-design.md`

## Global Constraints

- No `Math.random` in `src/`; seeded randomness via `rngFor`/`hash`. `src/core.js` stays pure (no DOM, no storage).
- Every `localStorage` key starts with `override-`; the new one is `override-best` (`{ "<level>": score }`).
- All visible text in `lang/en.json` via `t('key')` with a literal key (the lang test scans for `t('key')`). No em-dashes; typographic apostrophes (’) in visible text.
- Points: 10 per tile cleared, 20 per encrypted-cell hit, 30 per firewall unlocked, 50 per special created, 50 per worm or bomb fired, 100 per zero-day fired; times the chain factor (1 for a move's first wave, +1 per cascade wave, cap 5). Conversions do not count as created.
- The bot never calls `finale`; bot limits must not change.
- Conventional Commits, no attribution lines of any kind (no `Co-Authored-By`, no "Generated with").
- Run `node --test` (not `node --test tests/`). Browser checks: `node tools/shot.mjs <url> <out.png> [--size WxH] [--dpr N] [--won] [--eval JS]` with the dev server `python3 tools/serve.py` on port 8081 (already running at http://localhost:8081/).

## Review Focus

1. A save from before this change (no `score`, no `spare`), won or mid-level, must load: score 0, a won one runs `finale` silently and shows the win screen. Test in Task 1 (`fromSave`) and checked in Task 3.
2. A win with 0 spare moves and no specials: no show, win screen shows score normally. Test in Task 2.
3. A finale with many spare moves (e.g. 40) must finish quickly in the core (no endless loop) and the animation must stay near 10 s. Test in Task 2 (terminates, moves 0); speed-up checked in Task 3.
4. Skip mid-finale must land on exactly the saved end state (same grid and score as watching). Checked in Task 3.
5. Reduced motion: no finale animation, no count-up, no blinking. Checked in Task 4.

---

### Task 1: Score in the core

**Files:**
- Modify: `src/core.js` (wave, cascade, combo, move, saves; new `SCORE`, `pointsOf`)
- Modify: `src/levels.js` (`makeAttempt`: `score: 0`)
- Modify: `tests/helpers.mjs` (`mk` sets `score: 0`)
- Test: `tests/score.test.mjs` (new)

**Interfaces:**
- Produces: `export const SCORE = { tile: 10, crack: 20, unlock: 30, create: 50, fire: 50, zero: 100, chainCap: 5 }`; `export function pointsOf(step, chain) -> number` (step is a wave step `{ fired:[{i,s}], cleared:[], cracked:[], unlocked:[], created:[] }`); every wave step gets `points`; `S.score` grows by it. `cascade(S, steps, prefer, swipe, fire, chain = 1, calm = false)` (calm is used in Task 2; thread it to `gravity(S, steps, calm)` now, where `calm` skips `damp`). `validSave` accepts optional integer `score` (0..1e9) and `spare` (0..999); `fromSave` sets `score` to 0 when missing.

- [ ] **Step 1: Write the failing tests** in `tests/score.test.mjs`:

```js
test('pointsOf counts each part and the chain factor, capped at 5', () => {
  const step = { fired: [{ i: 0, s: 'h' }, { i: 1, s: 'z' }], cleared: [{}, {}, {}], cracked: [{}], unlocked: [1], created: [{}] };
  assert.equal(pointsOf(step, 1), 30 + 20 + 30 + 50 + 50 + 100);
  assert.equal(pointsOf(step, 2), 2 * 280);
  assert.equal(pointsOf(step, 9), 5 * 280);
});
test('a move adds its waves\' points to S.score, first wave at chain 1', () => {
  // a swap that clears one row of three: first wave is 30 points
  const S = mk(['A B A C', 'C A D E', 'D E F C', 'E F C D']);
  const r = move(S, 1, 5);
  const waves = r.steps.filter(s => s.k === 'wave');
  assert.equal(waves[0].points, 30);
  assert.equal(S.score, waves.reduce((a, w) => a + w.points, 0));
});
test('a combo is chain 1 and the cascade after it continues at 2', () => {
  // worm + worm: the combo wave scores at factor 1; any following wave at factor >= 2
  // (assert waves[k].points === pointsOf(waves[k], min(k + 1, 5)) for every wave of the move)
});
test('saves: score and spare optional integers; old saves load with score 0', () => {
  const S = mk(['A B', 'B A']); delete S.score;
  assert.equal(fromSave(toSave(S)).score, 0);
  assert.equal(validSave({ ...toSave(mk(['A B', 'B A'])), score: 1.5 }), false);
  assert.equal(validSave({ ...toSave(mk(['A B', 'B A'])), spare: -1 }), false);
  assert.ok(validSave({ ...toSave(mk(['A B', 'B A'])), score: 120, spare: 3 }));
});
```
Fill in the combo test with a concrete `mk` board using two adjacent worms (e.g. `Ah` next to `Bv`) and the per-wave assertion in the comment. Use whatever grid the existing `tests/core.test.mjs` worm + worm test uses as a model; if the first board above does not make exactly one row of three, adjust it so it does.

- [ ] **Step 2: Run** `node --test tests/score.test.mjs`. Expected: FAIL (`pointsOf` not exported).

- [ ] **Step 3: Implement.** `wave(S, cells, matched, creates, fired, chain = 1)` sets `step.points = pointsOf(step, chain)` and adds it to `S.score` (treat a missing `S.score` as 0). `cascade` passes `chain` to its first wave and `chain + 1`, `+ 2` … to later ones. In `move`'s combo path `combo` makes its wave at chain 1 and the following `cascade(S, steps, [], null, [], 2)`. `gravity(S, steps, calm = false)` skips `damp` when `calm`. `makeAttempt` sets `score: 0`; `mk` too.

- [ ] **Step 4: Run** `node --test`. Expected: all PASS (including bot tests: limits unchanged, because score does not affect play).

- [ ] **Step 5: Commit** `git add src/core.js src/levels.js tests/helpers.mjs tests/score.test.mjs && git commit -m "feat: level score counted in the core"`

### Task 2: Finale in the core

**Files:**
- Modify: `src/core.js` (new exported `finale`)
- Test: `tests/finale.test.mjs` (new)

**Interfaces:**
- Consumes: `cascade(..., chain, calm)`, `gravity(S, steps, calm)`, `wave(..., chain)` from Task 1.
- Produces: `export function finale(S) -> { steps }`. Precondition `won(S)`. Sets `S.spare` (moves left at the call; always set, 0 included) and `S.moves = 0`. `steps[0]` is `{ k: 'finale' }`; then `wave`, `fall` and `convert` steps (`{ k: 'convert', cells: [{ i, s }] }`, same shape `animate` already plays).

- [ ] **Step 1: Write the failing tests** in `tests/finale.test.mjs`:

```js
test('finale fires every leftover special and spends spare moves; deterministic', () => {
  const build = () => { const S = mk([...7 rows with an 'Ah' and a 'Bb' somewhere, no match...], { goals: [{ kind: 'tiles', t: 0, need: 1, got: 1 }], moves: 5 }); return S };
  const a = build(), b = build();
  const ra = finale(a), rb = finale(b);
  assert.deepEqual(ra.steps, rb.steps); assert.deepEqual(a, b);
  assert.equal(ra.steps[0].k, 'finale');
  assert.equal(a.spare, 5); assert.equal(a.moves, 0);
  assert.ok(a.grid.every(x => !x || !x.s));          // no specials left
  assert.ok(a.score > 0);
  assert.ok(ra.steps.some(s => s.k === 'convert'));   // spare moves turned into specials
});
test('nothing to do: only the marker, score unchanged, spare 0', () => {
  const S = mk([... no specials ...], { goals: [{ kind: 'tiles', t: 0, need: 1, got: 1 }], moves: 0 });
  const before = S.score, r = finale(S);
  assert.deepEqual(r.steps, [{ k: 'finale' }]); assert.equal(S.score, before); assert.equal(S.spare, 0);
});
test('forty spare moves terminate with moves 0 and no specials', () => {
  // 8x8 plain board, moves: 40; finale(S) returns; S.moves === 0; S.spare === 40; no specials remain
});
test('a spare move with no plain movable tile is skipped', () => {
  // board of only locked tiles and encrypted cells, moves: 3: steps === [{ k: 'finale' }], spare 3, moves 0
});
test('finale refills are not damped', () => {
  // over many seeds of a small board with spare moves, at least one finale wave after a fall happens with
  // no special fired in it (a refill made a line) -- proves damping is off. Pattern: the DAMP test in tests/refill.test.mjs.
});
```
Use real `mk` boards (the `...` above are for you to fill: 7 rows of 7 tokens, no line of three anywhere).

- [ ] **Step 2: Run** `node --test tests/finale.test.mjs`. Expected: FAIL (`finale` not exported).

- [ ] **Step 3: Implement `finale(S)`.** Algorithm:

```
spare = S.moves; S.spare = spare; S.moves = 0; steps = [{ k: 'finale' }]
burst():   while any special on the board:
             cells = Set(all cells holding a special)
             steps.push(wave(S, cells, new Set(), [], new Set(), 1)); gravity(S, steps, true)
             cascade(S, steps, [], null, [], 2, true)
burst()
for k in 0 .. spare-1:
  rnd = rngFor(S.seed, 29, k)
  plain = movable cells with a tile whose s is null (sorted by index); if none: continue
  i = plain[floor(rnd() * plain.length)]; s = rnd() < 1/3 ? 'b' : rnd() < .5 ? 'h' : 'v'
  S.grid[i].s = s; steps.push({ k: 'convert', cells: [{ i, s }] })
  burst()
return { steps }
```
A zero-day fired in a burst has no target: `area` already picks a random colour on the board (seeded). Guard the outer `burst` loop with a cap (e.g. 500 bursts) so a pathological board cannot loop forever.

- [ ] **Step 4: Run** `node --test`. Expected: all PASS.

- [ ] **Step 5: Commit** `git add src/core.js tests/finale.test.mjs && git commit -m "feat: finale fires leftover specials and spare moves after a win"`

### Task 3: UI plays the finale (save, animate, skip, reload, play log)

**Files:**
- Modify: `src/ui.js` (`play`, `animate` timing, `win`, `start`/boot reload path)
- Modify: `src/plays.js` (`close` records `score` and `spare` on a won attempt)
- Modify: `lang/en.json` (`finaleToast`)
- Test: `tests/plays.test.mjs` (won close records score and spare)

**Interfaces:**
- Consumes: `finale(S)` (Task 2), wave steps' `points` and `S.score` (Task 1).
- Produces for Task 4: `S.spare` and `S.score` final when `win()` runs; `animate(steps, speed)` accepts a speed factor. Score display is Task 4's; leave the HUD as is.

- [ ] **Step 1: Write the failing test** in `tests/plays.test.mjs`: closing an open attempt as `'won'` with an `S` that has `score: 1234, spare: 3` sets `attempt.score === 1234` and `attempt.spare === 3`; closing as `'lost'` sets neither.

- [ ] **Step 2: Run** `node --test tests/plays.test.mjs`. Expected: FAIL.

- [ ] **Step 3: Implement.**
  - `plays.js` `close(log, end, S, seconds)`: when `end === 'won'` and `S`, also set `a.score = S.score ?? 0`, `a.spare = S.spare ?? 0`.
  - `play(a, b)`: after `move`, if the result is ok and `won(S)`, call `finale(S)` before `save()`; keep the move's steps and the finale's steps separate.
  - Animate the move's steps as now; then, if there was a finale with more than the marker: `toast(t('finaleToast'))`, then animate its steps with a speed factor so the whole finale takes at most about 10 s. Approach: estimate the finale's duration from its step count at normal speed; speed = max(1, estimate / 10 s), ramping up over the finale is fine. Every step still plays. `en.json`: `"finaleToast": "Override: flushing the buffers"`.
  - Skip: while the finale animates, a `pointerdown` anywhere (document, capture; ignore the input `grace`) sets a flag that makes `animate` stop at the next step boundary; then `sync()`, `hud()`, and continue to `win()`. The saved `S` already holds the end state.
  - Reduced motion: skip the finale animation entirely (sync to the end).
  - Remove the old purely visual flourish loop in `win()`.
  - Reload: in the boot path, if the loaded `S` is won and `S.spare` is undefined, run `finale(S)` silently, `save()`, then show the win screen as today.
  - Win text uses `S.spare ?? S.moves` for "Moves to spare".

- [ ] **Step 4: Run** `node --test`. Expected: all PASS.

- [ ] **Step 5: Browser check.** With the server running, write a scratch eval that sets up a near-won state with specials left: load `http://localhost:8081/?level=12`, then in `--eval` (it awaits promises) set `localStorage['override-v1']` to the current save with all goals but one met, a few `s: 'h'`/`'b'` tiles placed on plain tiles, then reload and play a winning swap by dispatching pointer events on the canvas (or set goals fully met minus one and use any valid match). Take screenshots mid-finale and after; confirm the board changes, the toast shows, and the win sheet appears. Then repeat with a tap during the finale and confirm the final `S.score` in `localStorage` equals the watched run's. Put scratch scripts under `/tmp/claude-1000/-home-ibn-Development-Override/14ead642-949c-4c8b-936a-a902d9e92c73/scratchpad/`, never in the repo.

- [ ] **Step 6: Commit** `git add src/ui.js src/plays.js lang/en.json tests/plays.test.mjs && git commit -m "feat: the finale plays after a win, skippable by a tap"`

### Task 4: Score in the HUD, best scores, win screen

**Files:**
- Modify: `src/ui.js` (`hud`, `animate` ticking, `win`, best storage)
- Modify: `index.html` (HUD score element), `style.css` (HUD score, win score rows, NEW BEST)
- Modify: `lang/en.json` (`score`, `best`, `newBest`)
- Modify: `docs/architecture.md`, `CLAUDE.md` (keys list: add `override-best`), `ROADMAP.md` (score and finale done; payout/funds stay)

**Interfaces:**
- Consumes: `S.score`, `S.spare`, wave steps' `points`, `animate(steps, speed)` (Task 3).

- [ ] **Step 1: Implement best storage.** `override-best` read once at boot into an object (try/catch, junk becomes `{}`); `bestOf(level)` returns an integer or `null`; on a win, before writing, remember `prev = bestOf(level)`, then store `max(prev ?? 0, S.score)`.

- [ ] **Step 2: HUD.** Show the live score in the HUD with the level's best next to it when there is one (`score 1 240 · best 10 920`; numbers grouped with a thin space every 3 digits, `toLocaleString` is fine). `hud()` renders `S.score`; during `animate`, after each wave step, add its `points` to the shown number (so it ticks with the animation, ending equal to `S.score` after `sync()`). Placement: your call; it must not crowd the goals or the patrol count at 375 x 548 and 402 x 706 (screenshot both).

- [ ] **Step 3: Win screen.** Below the win text: terminal rows with dotted leaders, exactly as the approved mockup: `score .... 12 480` (large, glowing, counting up from 0 over about 1.2 s), then `best .... <n>` (the previous best when beaten, else the best; omitted on a first win), then an amber blinking `>> NEW BEST <<` (only when beaten; reuse the existing `alertflash` keyframes). A tap on the sheet during the count-up jumps to the final number. Reduced motion: final number at once, no blink. The `>>`/`<<` arrows and dotted leaders are decoration; the words come from `lang` (`"score": "score"`, `"best": "best"`, `"newBest": "NEW BEST"`).

- [ ] **Step 4: Run** `node --test`. Expected: all PASS (the lang test checks every `t('key')` matches `en.json`).

- [ ] **Step 5: Browser check.** Screenshots at 375 x 548 and 402 x 706: HUD with score and best during play; win sheet on a first win (score only) and on a beaten best (score, previous best, NEW BEST). Use `--won` with a seeded `override-best` in `--eval`.

- [ ] **Step 6: Docs.** `docs/architecture.md`: score (`SCORE`, `pointsOf`, chain factor, `points` on wave steps), `finale` (algorithm, calm gravity, `S.spare`), UI (finale animation, speed-up, skip, best scores, win rows). `CLAUDE.md`: add `override-best` to the keys list. `ROADMAP.md`: mark level score and the end-of-level finale done (stars dropped); payout to funds stays as the next part.

- [ ] **Step 7: Commit** `git add -A src index.html style.css lang docs/architecture.md CLAUDE.md ROADMAP.md && git commit -m "feat: score in the HUD, best scores and the win screen score rows"`
