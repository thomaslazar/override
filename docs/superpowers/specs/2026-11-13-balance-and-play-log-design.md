# Override balance pass and play log: design

Date: 2026-11-13. Status: approved in conversation ("in essence that's it"); builder-check calls marked below. Changes the core loop spec where it says
so; everything else there still holds.

## Intent

The owner played the first 20 or so levels after the visual overhaul: they end too fast, often
after 2 or 3 swaps because a cascade of refilled tiles clears every goal. "It is not fun if you're
not really playing." Levels should last a bit longer so the player feels they are doing
something. This is not about punishment: the game stays fair, limits stay generous, and a big
cascade now and then is still welcome. To keep tuning from real play instead of guesses, the game
gets an opt-in play log like Splice's, exported as a file.

Measured before this change (bot, levels 1 to 20, fails 0): 3.4 clear waves per move on average,
43 % of moves set off 4 or more waves, the bot wins in a median of 4 moves. The helpful refill is
not the cause (3.3 waves, 38 % with it off); plain random refill on 4 to 5 colour boards is.

## Goals

1. Fewer free cascades: refilled tiles rarely complete a match where they land. Target (bot,
   levels 1 to 20): about 1.5 to 2 waves per move on average and 4 or more waves on about 10 %
   of moves (from 3.4 and 43 %).
2. Levels last longer: target bot effort (fails-0 `need`, the median moves the bot needs) of
   about `8 + 14 * d` moves, `d` = `difficulty(level)`: about 8 on level 1, 16 on level 20, 21 on
   level 30, rising again per chapter. Within plus or minus 25 % for levels 1 to 60 is good enough.
3. A blocker only appears when its goal is in the level.
4. An opt-in play log with a file export and a report tool.

## Non-goals

- New rules, specials, blockers or goals. Board layouts (roadmap).
- Changing the bot's skill, the human factor `K`/`C`, the retry easing, or the helpful refill's
  boosts.
- Uploading logs anywhere. The file is shared by the player by hand.

## Anti-goals

- Punishing levels: limits must stay set by the bot under the same rules the player meets.
- No cascades at all: big chains must still happen sometimes.
- A level preparation slow enough to be felt (see Constraints).
- Logging anything without the player switching it on, or anything personal.

## Fairness, restated

The core spec says refills only ever lean the player's way ("weights only add"). That changes:
refills may now make a free match less likely, but both the player and the bot play with exactly
the same damped refill, and the bot's play sets every move limit. So a level's limit always
reflects the refill the player gets; damping costs the player nothing the limit does not cover.
The helpful refill's boosts (sets up near pairs, favours goal colours, more when behind) stay on
top for the player.

## Approaches

1. **Target length, tuned in the sim (chosen).** Damp the refill, then scale tile goals so the
   bot's median effort follows the target curve; the sim gains columns to check it.
2. **Fixed factor.** Multiply tile goals by 2.5. Simple, but stacks unknowingly with the damping
   and gives no way to see whether levels feel right.
3. **Refill only.** Damp cascades and leave goals. Levels would lengthen somewhat, but not to the
   owner's 2 to 3 times on early levels.

Play log: port Splice's design (pure module, opt-in, per-move entries, file export, report tool),
rather than an attempts-only log, because the per-move entries are what show cascades.

## Design

### Refill damping (`src/core.js`, refill section)

- New constant `DAMP` (start at 0.2, tune). In `refillWeights(S, i)`, for every colour `t`, if a
  tile of colour `t` would complete a line of 3 or more where it lands, multiply its weight by
  `DAMP`. Applies with and without `nice`, so the bot and the player share it. Multiply after the
  `nice` boosts are added.
- "Where it lands": the cell the new tile ends on after falling straight down in its column at
  spawn time (the lowest empty, fed cell below the spawn cell). The builder may refine this
  (diagonal fill) if the sim shows it matters.
- `setsUp` still excludes direct matches, so the helpful refill never adds a free match.
- If every colour would complete a match, all weights are damped equally (the draw still works).

### Goal sizes (`src/levels.js`, `makeAttempt`)

- Tile goal need gets a factor `GOAL` (new exported constant, start around 2.5, tune) on top of
  today's formula, including the two-colour 60 % split. `crack` and `firewall` needs stay the
  count of placed blockers.
- Tune `DAMP` and `GOAL` together with the sim until the median fails-0 `need` follows
  `8 + 14 * d` within 25 % on levels 1 to 60. If a level type cannot reach it by tile goals alone
  (all-blocker levels), that is fine; note it.

### Blockers only with their goal (`src/levels.js`, `makeAttempt`)

- Decide the goals first (from level, salt and drop, as today), then place only the blockers the
  goals use. Encrypted cells already always carry a `crack` goal. Firewalls get placed only when
  the `firewall` goal is drawn (today they are placed always and get a goal half the time).
- A level must still have at least one goal; with no blocker goal it is a tiles goal.
- Layout stays deterministic per level, salt and drop; retries keep layout and goals (as today).

### Balance tool (`tools/sim.mjs`)

Adds per level: the target (`8 + 14 * d`), `need` against target in percent, waves per move,
share of moves with 4 or more waves, and preparation time (already there). A summary line for the
run: median ratio need/target, mean waves per move, mean 4+ share.

### Play log

- `src/plays.js`, pure, tested in `tests/plays.test.mjs` (Splice's `src/plays.js` is the model):
  `logFrom(obj)` (validates a stored log), `attemptOf(S, at)`, `startAttempt`, `resume`,
  `move(log, entry)`, `close(log, end, S)`, `setOn`, `trim(log, max = 1e6)` (drops oldest attempts
  until the JSON is under the cap), `fileOf(log, device, date)`.
- Stored as `override-plays`. Off by default; a random id (8 to 32 chars, from
  `crypto.getRandomValues`) on first switch-on, so files from several devices can be told apart.
- Attempt: `level`, `fails`, `n`, `k`, `goals` (kind, colour, need), `limit`, `need` (the bot's
  estimate), `salt`, `drop`, `at` (ISO time), `moves` (array), `end` (`won`, `lost`, `left`),
  `left` (moves left at the end), `t` (seconds played).
- Move entry: `n` (move number), `w` (waves), `c` (tiles cleared), `sm` (specials made),
  `sf` (specials fired), `g` (each goal's `got` after the move), `sh` (1 if a reshuffle
  happened). A swap that is undone is not logged.
- UI (`src/ui.js`): Settings tab gets "Play log" on/off, and when on: the number of attempts
  logged, "Download log" and "Clear log" (asks first). Download saves
  `override-plays-YYYY-MM-DD.json` (`{ v, id, device, attempts }`, device = a short user-agent
  summary); where the browser can share files (iOS), it offers the share sheet, else a normal
  download. All text through `lang/en.json`.
- `tools/plays.mjs <file> [file ...]`: per level, attempts, wins, losses, quits, the player's
  median moves used against the bot's `need` and the limit, waves per move, share of 4+ wave
  moves; a total line. Tested lightly or verified on a sample file.

## Constraints

- No dependencies, no build, no `Math.random` in `src/` (the log id uses `crypto`).
- Preparation time: the sim's per-level `ms` (fails 0, desktop Node) must stay under 1.2 s for
  levels 1 to 60, and the median under twice today's (today about 200 to 500 ms). If longer
  levels push it over, lower `RUNS` work first (e.g. stop early once a salt passes), not the
  targets.
- Saves stay compatible: `S` gains no required field; old saves keep working.
- `localStorage` keys start with `override-` (new: `override-plays`).
- Docs: core spec's fairness wording and `CLAUDE.md` (refill section, levels, bot, files, keys)
  updated; `ROADMAP.md` tuning notes.

## Builder notes (my calls after a builder check)

- **Saves in progress**: an attempt saved before this change keeps its old limit and plays with
  the new damped refill. Accepted (one level per player, slightly harder); no save marker.
- **Acceptance for damping and goal sizes is the sim**, not a formula: the cascade numbers in
  Goals and the need/target ratio are targets to tune toward, best effort. Where the damping check
  runs (landing cell, diagonal fill, mid-gravity) is the builder's call, judged by the sim.
- **Blocker-only levels** may sit below the target curve; note them in the report rather than
  adding a per-kind factor.
- **Log fields** are derived from `move()`'s existing steps (waves = `wave` steps, cleared tiles,
  `created` for specials made, `fired` for specials fired, `shuffle` steps); `g` is each
  `S.goals[i].got` after the move. The step contract does not change.
- **Resume**: after a reload, the log continues the open attempt when level and fails match the
  saved attempt (as in Splice); otherwise the open one is closed as `left`.

## Testing

- `tests/refill.test.mjs`: a colour that would complete a match at its landing cell gets weight
  `DAMP` times what it had; others unchanged; with every colour damped the draw still returns a
  valid colour; same with `nice` on and off.
- `tests/levels.test.mjs`: no firewall on the board without a `firewall` goal, and the reverse;
  encrypted cells only with a `crack` goal; tile goals scale with `GOAL`.
- `tests/plays.test.mjs`: log validation, attempt and move recording, close and resume, trim
  under the cap, file name and shape.
- Sim run over levels 1 to 60 recorded in the plan's report: target ratios, cascades, ms.
