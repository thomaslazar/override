# Override level score and finale: design

Date: 2026-11-13. Status: approved in conversation (approach A, win screen mockup "looks good"); builder-check calls marked below. Branch
`feat/score-finale`. Extends the core loop spec; everything there still holds unless this file says so.

## Intent

When the goals are met, leftover specials just sit on the board. In the genre they go off, which is
the expected reward and a little show. The owner wants that, plus a level score that everything
cleared feeds into, including the finale's cascades. The score later turns into a payout that buys
starter specials before a level; that part is not in this round, but the score must be a solid
base for it.

## Goals

1. A level score from what you clear: tiles, blockers broken, specials made and fired, with
   cascades worth more. It never decides win or loss; goals do.
2. A finale after the winning move: every special still on the board fires, then each spare move
   turns a random plain tile into a worm or bomb that fires, cascades run until the board is still.
   All of it scores. Cascades are welcome here: the refill damping is off during the finale.
3. The finale is decided the moment the level is won (seeded, pure core), saved before it animates,
   and a tap skips the animation to the final board and score with the same result.
4. A best score per level, kept on the device. The HUD shows the live score while playing, and the
   level's best when there is one. The win screen shows this play's score counting up, the best,
   and "NEW BEST" when beaten.

## Non-goals

- Payout, funds, shop, starter specials (later roadmap items; the score is their base).
- Stars. The owner does not like the mechanic.
- Score in the bot or the move limits: the bot ignores score and never runs the finale.
- Leaderboards or sharing scores.

## Anti-goals

- A finale that drags: 40 spare moves must not mean a minute of waiting.
- A score that can change win or loss, or that the player can lose by skipping the animation.
- A finale that differs between watching and skipping, or between closing mid-show and staying.

## Approaches

- **A. Finale in the pure core (chosen).** `finale(S)` in `src/core.js`, seeded, returns the same
  kind of steps as `move`; the UI animates them with the existing `animate`. Score is counted in
  the core as waves resolve (`S.score`), so it is saved with `S`. Testable, skip is a jump to the
  saved end state, closing mid-show loses nothing.
- **B. Finale staged by the UI.** The UI fires specials one by one through `move`-like calls and
  counts score from what it animates. Quicker to hack, but the result depends on the animation,
  skip has to fake the end, closing loses the score, nothing testable. Dropped.

## Design

### Score (`src/core.js`)

- `S.score`: integer, starts at 0 in `makeAttempt`. Added to by every wave, in moves and in the
  finale. Points per wave, times the wave's chain factor:
  - 10 per tile cleared (plain or special),
  - 20 per encrypted-cell hit, 30 per firewall unlocked,
  - 50 per special created,
  - 50 per worm or bomb fired, 100 per zero-day fired.
- Chain factor: the wave's position in its chain, capped at 5. One counter per move: the first wave
  of a move is 1 (for a special swap that is the combo's wave), every following cascade wave of that
  move adds 1. In the finale each burst (the leftovers firing, or one spare move's special) starts
  again at 1 and its cascades continue the count. (Builder-check call.)
- A tile turned into a special by a conversion (zero-day combos, the finale's spare moves) does not
  score as "created"; it scores when it fires. (Builder-check call.)
- Each wave step carries `points` (what it added, after the factor), so the UI can tick the HUD as
  it animates.
- Values are a starting point; tune by playtest. Keep them as named constants (`SCORE`).

### Finale (`src/core.js`, `finale(S)`)

- Exported, pure, seeded. Called by the UI right after a winning `move`. Returns `{ steps }` and
  sets `S.spare` (the moves left when the level was won) and `S.moves = 0`.
- Steps start with `{ k: 'finale' }` (a marker for the UI), then:
  1. **Leftovers:** while any special is on the board, fire all of them as one wave (chains as
     usual), gravity, cascade. Repeat until none is left.
  2. **Spare moves:** for each spare move, pick a random plain movable tile (seeded,
     `rngFor(S.seed, 29, k)`), turn it into a worm (`h`/`v`) or bomb (seeded), emitting a `convert`
     step, fire it as a wave, gravity, cascade, then fire any specials that made (step 1 again).
  3. Stop when no spare moves are left and no specials are on the board.
- Gravity during the finale runs with damping off (refilled lines survive), so cascades happen. The
  switch is a parameter threaded through `cascade` and `gravity`, not a field on `S`. (Builder-check call.)
- A spare move with no plain movable tile to convert is skipped. `S.spare` is always set on a win,
  0 included, and keeps the original count even when moves were skipped. (Builder-check call.)
- No reshuffle during the finale. Goal counters keep counting (harmless; the level is won).
- A level won with no spare moves and no specials gets just the marker step (no show).
- Changed in testing (owner, 2026-11-14: 20+ spare moves took ages one at a time): spare moves go in
  rounds of up to 5 (`FINALE_BATCH`). Each round turns up to 5 distinct plain tiles special in one
  `convert` step (`spent` = moves used, the HUD drops by it) and fires them together, then cascades.
  Seed per round: `rngFor(S.seed, 29, round)`. A round with no plain tile is skipped whole.

### Saving and reload (`src/ui.js`, `src/core.js`)

- `play` calls `move`; on a win it calls `finale(S)` at once and saves before animating. So the
  saved `S` is already the end state; closing mid-show loses nothing.
- `validSave` accepts optional `score` and `spare` (integers); `fromSave` defaults `score` to 0.
- A won save without `spare` (from before this change) runs `finale` silently on load, then shows
  the win screen.

### Best scores (`src/ui.js`)

- New key `override-best`: `{ "<level>": score }`. Written when a level is won, if higher. One best per
  level across retries, restarts and its 10 boards. (Builder-check call.)
- The win screen reads the best before writing, so it can show the previous best and NEW BEST.

### UI: animation, skip, HUD, win screen (`src/ui.js`, `index.html`, `style.css`, `lang/en.json`)

- HUD: the live score in the HUD, with the level's best next to it when there is one (for
  example `score 1 240 · best 10 920`). Placement is the builder's, checked on 375 x 548 and
  402 x 706 (it must not crowd the goals or the patrol count).
- During `animate`, each wave step's `points` tick the HUD score.
- Finale animation (the toast was dropped in testing 2026-11-14: it overlapped the win screen): the steps play with a speed-up so the whole finale takes at most about 10 s
  (every step still plays, faster). Reduced motion: no animation, straight to the end.
- Skip: during the finale, a tap anywhere on the board (or the page) stops the animation, `sync()`s
  to the saved end state, and goes to the win screen. The skip ignores the input grace. A tap on the
  win screen during the count-up jumps it to the final number.
- Win screen (mockup approved): below "Moves to spare: n" (n is `S.spare`), terminal rows with
  dotted leaders: `score .... 12 480` (large, glowing) counting up from 0 over about 1.2 s
  (instant under reduced motion), then `best .... 10 920` (the previous best when beaten, else the
  best), then an amber blinking `>> NEW BEST <<` only when beaten. A first win shows only the
  score row. A skip during the count-up jumps it to the final number.
- The old purely visual win flourish (flashes per spare move) goes; the finale replaces it.
- All new visible text in `lang/en.json` (`score`, `best`, `newBest`, the finale toast).

### Play log (`src/plays.js`)

- A won attempt records `score` and `spare`.

## Constraints

- Vanilla ES modules, no dependencies, no build step. No `Math.random` in `src/`.
- `src/core.js` stays pure (no DOM, no storage).
- Keys start with `override-`; add `override-best` to the list in `CLAUDE.md`.
- No em-dashes in copy or docs; typographic apostrophes in visible text.
- Bot limits unchanged: the bot never calls `finale`, and score has no effect on `move`'s result.
- `docs/architecture.md` describes score and finale; `ROADMAP.md` marks score and finale done
  (payout and funds remain).

## Left to the builder

- Exact HUD placement and look of the score.
- The speed-up curve for the finale (keep it readable for short finales).
- Exact finale toast copy.

## Testing

- Core: score adds the right points for a known wave (tile, crack, unlock, create, fire, chain
  factor and its cap). `finale` on a won state with specials and spare moves: deterministic (two
  copies give equal `S` and steps), leaves no specials, sets `moves` 0 and `spare`, score only grows.
  A won state with no specials and no spare moves: only the marker step, score unchanged.
  Finale gravity does not damp (a refilled line can survive).
- Saves: `validSave` accepts `score`/`spare`, rejects non-integers; old saves load with score 0.
- Bot: limits for a sample of levels are unchanged by this work.
- Browser: a win with specials left plays the finale, a tap skips to the same score, the win screen
  shows score, best and NEW BEST; checked at 375 x 548 and 402 x 706.
