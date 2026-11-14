# Board layouts, teleporters and drop goals Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Boards gain holes, blocks, spawners anywhere, teleporters and drop goals, picked from a library of whole-board templates next to square boards with blocker patterns.

**Architecture:** Static board features live in `S` as optional JSON-safe fields read by the pure core (gravity follows one `above(S, i)` helper that knows dead cells and teleporters). Templates are text grids in a new pure `src/layouts.js`; `src/levels.js` picks a board per level and fills it; the bot plays it and sets the limit. Three stages on one branch, the owner tests after each.

**Tech Stack:** Vanilla ES modules, `node --test`, canvas drawing in `src/ui.js`.

**Spec:** `docs/superpowers/specs/2026-11-14-board-layouts-design.md`

## Global Constraints

- Vanilla ES modules, no dependencies, no build step. No `Math.random` in `src/`.
- `src/core.js`, `src/levels.js`, `src/layouts.js`, `src/bot.js` stay pure (no DOM, no storage).
- Saves stay compatible: every new `S` field is optional; a save without them is a plain square board.
- Square levels without blockers keep their boards and limits; square levels with blockers get the new patterns and new bot limits.
- Preparation: the sim's per-level `ms` (fails 0, desktop Node) under 1.2 s for levels 1 to 60, median under twice today's (today about 260 ms).
- Blasts of worms, bombs and zero-days pass over dead cells. Matches and blasts never reach across a teleporter.
- Drop tiles: never match, never special, never destroyed; swap only when the swap makes a match for the other tile; any drop point takes any kind; never more on the board than the goals still need. Drawn unlike any poppable tile (different silhouette, not a coloured rounded tile with a glyph).
- First use on breathers: shapes and geometry from level 11, teleporters from 16, drop goals from 21. Board kind, template and mirror depend on `level` only.
- No em-dashes in copy or docs; typographic apostrophes (’) in visible text; all visible text in `lang/en.json`.
- Conventional Commits, no attribution lines of any kind.
- Run `node --test` (not `node --test tests/`) and, after rule or balance changes, `node tools/sim.mjs`.
- Keep `docs/architecture.md` in step with the code.
- **Stage stops:** after Task 5 and after Task 7 the controller stops and hands the branch to the owner for testing on the dev server before continuing.

## Review Focus

1. A save made on master (no new fields) loads and plays exactly as before: Task 1 test.
2. A region under a block or hole that only diagonal slides can reach still fills after a clear, and gravity terminates: Task 1 test.
3. A template level retried or restarted keeps its template and mirror, only blockers and tiles move: Task 3 test.
4. A drop tile sitting on a drop point at the start of the level or after a reshuffle leaves at the next settle, never gets stuck: Task 8 test.
5. A teleporter egress below its own ingress (pair pointing up the board) still moves tiles and gravity terminates: Task 6 test.

---

## Data shapes (decided here, used by every task)

- `S.cell`: optional array, length `n*n`, values `0` live, `1` hole, `2` block. Absent means all live.
- `S.spawn`: optional array of `{ i, d }` (`d`: drop kind 0..2 this spawner may spawn, or `-1` any). Absent means every live top-row cell is a spawner with `d: -1`.
- `S.tp`: optional array of `[ingress, egress]` cell pairs.
- `S.exit`: optional array of drop point cells.
- `S.board`: optional string, the template name or `square:<pattern>`, for logs and the sim.
- Drop tile: `{ id, t: -1, s: null, lock: false, d: 0..2 }`. `DROP_KINDS = 3`.
- Drop goal: `{ kind: 'drop', d: 0..2, need, got }`.
- Drop schedule: `S.drops = { every: 0 | N, wait: int }` (`every: 0` means "after the previous left"). Optional, only on drop levels.
- Template legend (space-separated tokens per cell, like `tests/helpers.mjs`): `.` live, `o` hole, `#` block, `z` live blocker zone, `S` spawner, `S0` `S1` `S2` spawner for that drop kind only, `iA`..`iH` teleporter ingress of pair A..H, `eA`..`eH` its egress, `X` drop point, `D0` `D1` `D2` live cell starting with that drop tile.

## Stage 1: geometry and spawners

### Task 1: Dead cells and spawners in the core

**Files:**
- Modify: `src/core.js` (gravity, `fed`, `fillBoard`, `validSave`, new `above`, `isSpawner`, `dead`)
- Modify: `tests/helpers.mjs` (`mk` tokens `o` hole, `#B` block, `S` suffix spawner, e.g. `AS`)
- Test: `tests/layout-core.test.mjs` (new)

**Interfaces:**
- Produces: `export const dead = (S, i) => !!S.cell?.[i]`; `export function above(S, i) -> int` (the cell gravity pulls from: `-1` when none; Task 6 extends it for teleporters); `export function isSpawner(S, i) -> {i, d} | null`. Gravity spawns at an empty spawner cell when `above` gives no movable tile.

- [ ] **Step 1: Write failing tests**
  - `dead cells never fill`: 5x5 with a hole at (2,2); clear column 2 via a vertical match; after `move`, `S.grid[hole] === null` and no step spawns or moves into it.
  - `no match across a hole`: row `A A o A A` gives `findGroups(S).length === 0`.
  - `worm passes over a block`: a worm fired in a row with a block clears every live cell of the row (wave `cleared` has all live cells, the block cell has no tile).
  - `cell under a block fills by a diagonal slide`: block at (1,2), clear (2,2) and (3,2); after gravity no live cell is empty.
  - `mid-board spawner feeds a lower half`: 6x6, row 2 all blocks, spawners on row 3; a match in rows 3 to 5 refills from row 3; no tile ever passes row 2.
  - `a save without the new fields loads as before`: `fromSave(toSave(S))` of a plain `mk` board deep-equals and `validSave` rejects `cell` of wrong length or values outside 0..2, `spawn` entries with `i` out of range.
- [ ] **Step 2: Run `node --test tests/layout-core.test.mjs`**, expect failures.
- [ ] **Step 3: Implement.** `gravity` per empty live cell: shift from `above(S,i)` if movable; else spawn if `isSpawner`; else diagonal fill unless straight-fed. `fed` walks `above` up to a spawner (false on dead, encrypted or locked; guard against cycles with a visited set). `fillBoard` skips dead cells. Square boards without `cell`/`spawn` behave byte-for-byte as today (same steps, same RNG draws).
- [ ] **Step 4: Run `node --test`**, all pass (existing 89 unchanged).
- [ ] **Step 5: Commit** `feat: dead cells and spawners anywhere in the core`

### Task 2: Template library and validation

**Files:**
- Create: `src/layouts.js`
- Test: `tests/layouts.test.mjs` (new)

**Interfaces:**
- Consumes: `dead`, `above`, `isSpawner` (Task 1).
- Produces: `export const TEMPLATES` (array of `{ name, dMin, dMax, tags, mirror: bool, rows: string[] }`); `export function parse(t, mirror=false) -> { n, cell, spawn, tp, exit, zone, drops }` (`zone`: cells where blockers may go, all live non-feature cells when the template marks none; `drops`: `[{i, d}]` starting drop tiles); `export function check(layout) -> string[]` (problems, empty when valid).

- [ ] **Step 1: Failing tests**
  - `every template parses, both mirrors, and check() is empty` (loop over `TEMPLATES`).
  - `check finds an unreachable cell`: a hand-made layout with a live pocket closed on all sides by blocks returns a non-empty list.
  - `mirror flips columns`: a template with a hole at (0,0) mirrored has it at (0,n-1).
  - `n stays 7 to 9`.
- [ ] **Step 2: Run, expect failures.**
- [ ] **Step 3: Implement** `parse`, `check` (reach: a live cell is reachable if a spawner reaches it by gravity, straight or diagonal; simulate by filling an empty board with gravity on a dummy state and checking every live cell holds a tile; also at least one legal move after `fillBoard`), and 7 to 9 stage-1 templates tagged `shape` or `walled`/`split` (notched corners, hourglass, diamond, frame, pillars, wall across the middle with row spawners below, walled pocket). Pick from `docs/research/2026-11-11-layout-gallery.md`. Bands `dMin`/`dMax` spread over 0..1.
- [ ] **Step 4: Run `node --test`**, pass.
- [ ] **Step 5: Commit** `feat: board template library with validation`

### Task 3: Levels pick a board

**Files:**
- Modify: `src/levels.js` (`boardFor`, blocker patterns, `makeAttempt`)
- Test: `tests/levels.test.mjs`

**Interfaces:**
- Consumes: `TEMPLATES`, `parse` (Task 2).
- Produces: `export function boardFor(level, fb = 0, tags) -> { kind: 'square', pattern } | { kind: 'template', name, mirror }` (from `level` only; `fb` 1 = a template of a lower band, 2 = square); `export const SHAPES_FROM = 11, TP_FROM = 16, DROP_FROM = 21`; `makeAttempt(level, fails, salt, drop, deal, fb = 0)` sets `S.board` and the feature fields.

- [ ] **Step 1: Failing tests**
  - `square levels without blockers unchanged`: levels 1 to 3 give the same `grid` colours and goals as on master (record the master values in the test first, by running the master code once).
  - `board depends on level only`: for a template level, `makeAttempt` with different `fails`, `salt`, `deal` keeps `S.board`, `S.cell`, `S.spawn`.
  - `no templates before SHAPES_FROM`: levels 1 to 10 are all `square`.
  - `blockers stay in zones`: on template levels encrypted cells and firewalls sit only on zone cells, never on a spawner.
  - `patterns on squares`: square levels with blockers report `S.board` as `square:<ring|wall|cross|diagonal|pairs>`.
- [ ] **Step 2: Run, expect failures.**
- [ ] **Step 3: Implement.** Mix: from `SHAPES_FROM` about 1 in 4 levels is a template, rising to about 1 in 2 by the end of a chapter; every 5th level prefers tags `walled`, `split`, `funnel`; the first template level is a breather. Template `n` overrides `paramsFor`'s `n`. Use a new RNG stream (`rngFor(level, 31)`) for board choice so existing streams keep their draws.
- [ ] **Step 4: `node --test`**, pass.
- [ ] **Step 5: Commit** `feat: levels pick square patterns or templates`

### Task 4: Bot, sim and play log

**Files:**
- Modify: `src/bot.js` (`copy`, `base` fallback), `tools/sim.mjs` (board column), `src/plays.js` (`board` in attempts), `tools/plays.mjs` (group by board)
- Test: `tests/bot.test.mjs`, `tests/plays.test.mjs`

**Interfaces:**
- Consumes: `makeAttempt(..., fb)`, `boardFor` (Task 3).
- Produces: `base(level)` memo gains `fb`; `prepare` passes it.

- [ ] **Step 1: Failing tests**: `bot wins template levels` (sample levels with templates finish below `CAP`); `fallback order` (with a stubbed always-failing level, `fb` goes 0 then 1 then 2); `attempt records board`.
- [ ] **Step 2: Run, expect failures.**
- [ ] **Step 3: Implement.** Fallback: ease `drop` on the same board as today (stop at 0.5 for templates), then `fb = 1`, then `fb = 2`. `copy` keeps static arrays by reference and copies `drops`.
- [ ] **Step 4: `node --test`**, then `node tools/sim.mjs 1-60`: record summary, per-level ms, which levels fell back; ms within the Global Constraints.
- [ ] **Step 5: Commit** `feat: bot and sim play template boards`

### Task 5: Drawing holes, blocks and spawners; docs

**Files:**
- Modify: `src/ui.js`, `style.css` if needed, `docs/architecture.md`, `ROADMAP.md`

- [ ] **Step 1: Implement.** Holes: no cell background, the board backdrop follows the shape. Blocks: a solid drawn piece, clearly not a tile and not an encrypted cell. Spawner marks only where spawners differ from the default top row. Taps on dead cells do nothing.
- [ ] **Step 2: Check** with `node tools/shot.mjs "http://localhost:8081/?level=N"` for one square-pattern level and three template levels (find them with the sim) at 402x706 and 375x548; look at enlarged crops.
- [ ] **Step 3: Docs.** `docs/architecture.md`: board model, `above`, templates, board choice. `ROADMAP.md`: items 1 to 3 merged into this feature (stage 1 done), later ideas "drop point per kind", "blocks stop blasts", "layered generation (B)"; fix the finale line ("rounds of 5").
- [ ] **Step 4: `node --test`**, pass.
- [ ] **Step 5: Commit** `feat: draw holes, blocks and spawners`. **Stage stop: owner tests.**

## Stage 2: teleporters

### Task 6: Teleporters in the core

**Files:**
- Modify: `src/core.js` (`above`, `fed`, `validSave`), `tests/helpers.mjs` (`mk` option `tp: [[a,b]]`)
- Test: `tests/layout-core.test.mjs`

- [ ] **Step 1: Failing tests**: `tile falls through a teleporter` (clear the egress, the tile from the ingress arrives there in a `fall` step move from ingress to egress); `cell below an ingress is not fed from it`; `cell above an egress does not feed it`; `egress below its ingress and pointing up the board both terminate`; `matches do not cross` (ingress and egress tiles never form a line with each other unless board-adjacent); `blasts do not cross` (a worm in the ingress row does not clear the egress row); `validSave` rejects pairs out of range or a cell used twice.
- [ ] **Step 2: Run, expect failures.**
- [ ] **Step 3: Implement:** `above(S, egress) = ingress`; `above(S, i)` is `-1` when `i - n` is an ingress. Diagonal slides do not use teleporters.
- [ ] **Step 4: `node --test`**, pass.
- [ ] **Step 5: Commit** `feat: teleporters in the core`

### Task 7: Teleporter templates and drawing

**Files:**
- Modify: `src/layouts.js` (pairs, `check` rules: every pair complete, each cell in one pair at most, no gravity loop), `src/levels.js` (teleporter templates from `TP_FROM`), `src/ui.js` (pair marks, animation), `docs/architecture.md`
- Test: `tests/layouts.test.mjs`, `tests/levels.test.mjs`

- [ ] **Step 1: Failing tests**: `check finds a half pair`, `check finds a loop`; `no teleporter templates before TP_FROM`.
- [ ] **Step 2: Run, expect failures.**
- [ ] **Step 3: Implement** 3 to 4 templates: column snake, mirrored crossing, split halves fed by teleporter. Marks: ingress on the bottom edge, egress on the top edge, same letter or glyph and colour on both. A tile through a teleporter sinks out at the ingress and drops in at the egress.
- [ ] **Step 4: `node --test`**, sim 1-60, screenshots of two teleporter levels at both sizes.
- [ ] **Step 5: Commit** `feat: teleporter templates and drawing`. **Stage stop: owner tests.**

## Stage 3: drop goal

### Task 8: Drop tiles in the core

**Files:**
- Modify: `src/core.js` (`swapLegal`, `move`, `wave`, `gravity` exit pass, `reshuffle`, spawn of drops, `SCORE.exit = 200`, `validSave`), `tests/helpers.mjs` (`D0`..`D2` tokens, `X` suffix drop point, `drops` option)
- Test: `tests/drops.test.mjs` (new)

**Interfaces:**
- Produces: `export const DROP_KINDS = 3`; step `{ k: 'exit', i, id, d, points }`; goal kind `drop`.

- [ ] **Step 1: Failing tests**
  - `drop tiles never match` (three `D0` in a row: no group).
  - `swap rule`: swapping a drop with a tile that then makes a line is legal and the drop moves; one that makes no line for the other tile is not; drop with drop is not; a special with a drop only if the special lands in a match, and no combo fires.
  - `no wave clears a drop`: worm, bomb, zero-day and zero-day+zero-day over a drop leave it on the board.
  - `drop leaves at a drop point`: after gravity settles a drop on an `X` cell emits `exit`, bumps its goal, adds `SCORE.exit` to `S.score`, and the cell refills.
  - `drop on a drop point at start or after a reshuffle leaves at the next settle`.
  - `schedule after`: the next drop spawns only when none is on the board; `schedule every 3`: one every 3 moves; never more on the board than needed; a kind-limited spawner spawns only its kind.
  - `reshuffle leaves drops in place`; `finale leaves drops`.
- [ ] **Step 2: Run, expect failures.**
- [ ] **Step 3: Implement.** Drops fall like tiles (diagonal slides included). The exit pass runs when a gravity pass settles, then gravity continues.
- [ ] **Step 4: `node --test`**, pass.
- [ ] **Step 5: Commit** `feat: drop tiles and drop goals in the core`

### Task 9: Drop templates, levels and bot

**Files:**
- Modify: `src/layouts.js` (drop templates; `check`: every drop spawner reaches a drop point), `src/levels.js` (drop goals from `DROP_FROM`, need 1 to 4 per kind by difficulty, schedule), `src/bot.js` (`value` progress term)
- Test: `tests/layouts.test.mjs`, `tests/levels.test.mjs`, `tests/bot.test.mjs`

- [ ] **Step 1: Failing tests**: `check finds a drop spawner with no path`; `drop goals only from DROP_FROM`; `bot finishes drop levels` (sample of drop template levels finish below `CAP`).
- [ ] **Step 2: Run, expect failures.**
- [ ] **Step 3: Implement** 3 to 4 drop templates, including the corner run (spawner top left, drop point bottom right, each column's bottom ported to the next column's top) and the mirrored funnel (spawners top left and right, two drop points bottom middle, teleporters funnelling both sides). Bot: for each drop on the board subtract a distance to the nearest drop point along gravity, teleporters and one-step swaps (BFS over cells, precomputed per board), weighted so a drop moving closer beats a plain clear.
- [ ] **Step 4: `node --test`**, sim 1-60 with drop levels' need and ms.
- [ ] **Step 5: Commit** `feat: drop templates, drop goals in levels, bot drop progress`

### Task 10: Drawing drops; final docs

**Files:**
- Modify: `src/ui.js` (drop pieces, exit effect, drop point marks, HUD drop goals), `lang/en.json` (drop kind names, goal text), `docs/architecture.md`, `ROADMAP.md`, `CLAUDE.md` (new file `src/layouts.js` and test files)

- [ ] **Step 1: Implement.** Drop pieces per kind with their own silhouette, unlike any poppable tile (owner). Drop point mark on the cell's bottom edge. Exit: the piece slides out through the bottom edge with a short flash. HUD: a counter per drop kind with its piece.
- [ ] **Step 2: Check** screenshots of the corner run and the mirrored funnel at both sizes.
- [ ] **Step 3: Docs** complete for all three stages.
- [ ] **Step 4: `node --test`**, sim summary.
- [ ] **Step 5: Commit** `feat: draw drop tiles, drop points and drop goals`. Hand the branch to the owner.
