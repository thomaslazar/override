# Balance Pass and Play Log Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fewer free cascades, longer levels on a target curve, blockers only with their goal, and an opt-in play log with file export and a report tool.

**Architecture:** Damping lives in `src/core.js`'s refill section and applies to player and bot alike; goal sizes and blocker placement change in `src/levels.js`; `tools/sim.mjs` gains the measurements used to tune two constants (`DAMP`, `GOAL`). The play log is a new pure module `src/plays.js` (modelled on Splice's), wired into `src/ui.js`, with a report tool `tools/plays.mjs`.

**Tech Stack:** Vanilla ES modules, Node's built-in test runner, headless Chromium via `tools/shot.mjs` for the UI check.

**Spec:** `docs/superpowers/specs/2026-11-13-balance-and-play-log-design.md` (read it first; its targets and field names are binding).

## Global Constraints

- No dependencies, no build, no `Math.random` in `src/` (the log id uses `crypto.getRandomValues`).
- Pure modules stay pure: `src/core.js`, `src/levels.js`, `src/bot.js`, `src/plays.js` have no DOM or storage.
- Every `localStorage` key starts with `override-`; new key `override-plays`.
- All visible text via `t(key)` from `lang/en.json`; the "UI uses exactly the keys in en.json" test must stay green. No em-dashes; typographic apostrophes in visible text.
- Saves stay compatible: `validSave` unchanged, `S` gains no required field.
- Preparation time: sim `ms` per level (fails 0, desktop Node) under 1.2 s for levels 1 to 60; median under twice today's.
- Tuning targets (bot, best effort): waves per move about 1.5 to 2 and 4+ waves on about 10 % of moves over levels 1 to 20; fails-0 `need` within 25 % of `8 + 14 * difficulty(level)` over levels 1 to 60.
- Run `node --test` (not `node --test tests/`). Conventional Commits. **No attribution of any kind** in commits or files.

## Review Focus

1. Every colour damped at once: the refill must still return a valid colour and never loop (Task 1 test).
2. A level whose drawn goals use no blocker: no firewall and no encrypted cell on the board, and at least one goal remains (Task 2 test).
3. A reload mid-level with the log on: the same attempt continues, no duplicate attempt (Task 5 test, Task 6 browser check).
4. Log growing past the cap: oldest attempts drop, the open attempt never does (Task 5 test).
5. Download on a phone that cannot share files: falls back to a normal download, no error (Task 6 browser check of the fallback path).

---

### Task 1: Refill damping

**Files:**
- Modify: `src/core.js` (refill section), `tests/refill.test.mjs`

**Interfaces:**
- Produces: `export const DAMP` (start 0.2); `export function landingCell(S, i) -> number` (the cell a tile spawned at `i` ends on falling straight down: the lowest empty, fed cell below `i` in its column, or `i`); `refillWeights(S, i)` multiplies a colour's weight by `DAMP` when a tile of that colour at `landingCell(S, i)` would complete a line of 3+ (use the existing `lineAt`-style check on a temporary grid), applied after the `nice` boosts, with `nice` on and off.

- [ ] **Step 1: Write failing tests** in `tests/refill.test.mjs` (builders in `tests/helpers.mjs`): `landingCell` on an empty column returns the bottom empty cell and on a full column returns the spawn cell; a colour that completes a horizontal pair at the landing cell gets `DAMP` times the weight of the same setup without the pair (nice off) and `DAMP` times its boosted weight (nice on); colours that complete nothing keep their weight; when every colour would complete a match, all are damped and `spawnColour` returns an integer in `[0, k)`.
- [ ] **Step 2: Run** `node --test`; the new tests FAIL.
- [ ] **Step 3: Implement** `DAMP`, `landingCell`, the damping in `refillWeights`. Keep "weights only add" wording out of comments; say "damped colours" instead.
- [ ] **Step 4: Run** `node --test`; all PASS (existing refill tests may need their expectations widened only where a damped colour is now involved; explain any change in the report).
- [ ] **Step 5: Commit** `feat: damp refills that would complete a match on landing`.

### Task 2: Blockers only with their goal, tile goal factor

**Files:**
- Modify: `src/levels.js` (`makeAttempt`), `tests/levels.test.mjs`

**Interfaces:**
- Produces: `export const GOAL` (start 2.5) multiplying the tile goal need (including the two-colour 60 % split); goals are decided before blockers are placed.

- [ ] **Step 1: Write failing tests**: for levels 1 to 60 at salt 0, a board has firewalled tiles if and only if a `firewall` goal exists; encrypted cells if and only if a `crack` goal exists; every attempt has at least one goal; a tiles goal's `need` equals `GOAL` times the old formula (rounded) for a level where it is a single-colour goal; layout and goals for the same level, salt and drop are equal across `fails` 0 and 3.
- [ ] **Step 2: Run** `node --test`; the new tests FAIL.
- [ ] **Step 3: Implement**: draw the goal kinds first from the same `rngFor(level, salt, 5)` stream (crack when `p.enc > 0`, firewall with today's 50 % when `p.fw > 0`, tiles as today), then place encrypted cells only with a crack goal and firewall spots only with a firewall goal; keep the layout stream (`lr`) order otherwise unchanged; apply `GOAL`.
- [ ] **Step 4: Run** `node --test`; all PASS.
- [ ] **Step 5: Commit** `feat: bigger tile goals, blockers only with their goal`.

### Task 3: Balance measurements in the sim

**Files:**
- Modify: `tools/sim.mjs`

**Interfaces:**
- Consumes: `prepare`, `pick` from `src/bot.js`; `move`, `won`, `mulberry32` from `src/core.js`; `difficulty` from `src/levels.js`.
- Produces: new columns `target` (`round(8 + 14 * d)`), `ratio` (need / target, percent), `w/m` (waves per move), `4+` (percent of moves with 4 or more `wave` steps) and a summary line (median ratio, mean waves per move, mean 4+ share, median and max ms).

- [ ] **Step 1: Implement**: after `prepare`, replay three bot games on copies (seeds 0..2, `pick` with `mulberry32`, `nice` off, up to `CAP` moves) counting `wave` steps per move; print the new columns and the summary. Keep existing columns and flags.
- [ ] **Step 2: Run** `node tools/sim.mjs 1-20` and record the output in the report (this is the post-Task-1/2 baseline before tuning).
- [ ] **Step 3: Commit** `feat: sim reports target length and cascades`.

### Task 4: Tune DAMP and GOAL

**Files:**
- Modify: `src/core.js` (`DAMP`), `src/levels.js` (`GOAL`), possibly `src/bot.js` (only if preparation gets too slow)

- [ ] **Step 1: Tune**: adjust `DAMP` until levels 1 to 20 show about 1.5 to 2 waves per move and about 10 % 4+ moves; then adjust `GOAL` until the median `need/target` over levels 1 to 60 is between 85 % and 115 % with most levels within 25 %. Note blocker-only levels that sit below target (allowed by the spec).
- [ ] **Step 2: Check time**: every level's `ms` under 1200 and the median under twice the pre-change median (measure the pre-change median with `git stash` or on `master`). If too slow, make `prepare` cheaper (e.g. stop the salt loop early) without changing results' meaning.
- [ ] **Step 3: Run** `node --test` (PASS; update test expectations that pin goal numbers only where they derive from `GOAL`).
- [ ] **Step 4: Commit** `tune: refill damping and goal size` with the final summary line in the commit body.

### Task 5: Play log module

**Files:**
- Create: `src/plays.js`, `tests/plays.test.mjs`

**Interfaces:**
- Produces (all pure, mutate only the log passed in): `PLAYS_V = 1`, `PLAYS_MAX = 1e6`; `logFrom(obj) -> {v, on, id, attempts}`; `attemptOf(S, at: string) -> attempt` with `level, fails, n, k, goals:[{kind, t?, need}], limit, need, salt, drop, at, moves: [], end: null, left: null, t: 0`; `startAttempt(log, attempt)` (closes an open one as `left`); `resume(log, S) -> boolean` (true when the open attempt matches `S.level` and `S.fails`, else closes it as `left`); `logMove(log, entry)` (appends `{n, w, c, sm, sf, g, sh}` to the open attempt); `entryOf(S, steps, n) -> entry` (derives the fields from `move()` steps: `w` = count of `wave`, `c` = sum of `cleared.length`, `sm` = sum of `created.length`, `sf` = sum of `fired.length`, `sh` = 1 if any `shuffle`, `g` = `S.goals.map(g => g.got)`); `close(log, end, S, seconds)`; `setOn(log, on)` (turning off drops an open attempt); `trim(log, max)`; `fileOf(log, device, date) -> {name, text}` with name `override-plays-YYYY-MM-DD.json` and text `{v, id, device, attempts}`.

- [ ] **Step 1: Write failing tests** covering: `logFrom` rejects junk and keeps a valid log; start, two moves, close as won; `resume` true for the same level and fails, false (and closes as `left`) otherwise; `entryOf` on a hand-built step list; `trim` drops oldest closed attempts and never the open one; `setOn(false)` drops the open attempt; `fileOf` name and parsed shape.
- [ ] **Step 2: Run** `node --test`; FAIL (module missing).
- [ ] **Step 3: Implement** `src/plays.js`; add it to `SHELL` in `sw.js` and bump `CACHE` to `override-5` (update the cache test and `CLAUDE.md` mention).
- [ ] **Step 4: Run** `node --test`; all PASS.
- [ ] **Step 5: Commit** `feat: play log module`.

### Task 6: Play log in the game

**Files:**
- Modify: `src/ui.js`, `lang/en.json`, `style.css` (only if needed)

**Interfaces:**
- Consumes: Task 5's API.

- [ ] **Step 1: Wire it**: load/save the log under `override-plays` (try/catch like other storage); `begin`/`start`: `resume` or `startAttempt(attemptOf(S, new Date().toISOString()))` when on; `play()`: after a successful `move`, `logMove(entryOf(S, r.steps, n))`; win/lose: `close` with `won`/`lost`, moves left and seconds since start; `trim` before each save. Settings tab: "Play log" on/off; when on, "{n} attempts logged", "Download log", "Clear log" (asks first via `confirmSheet`). First switch-on creates the id with `crypto.getRandomValues` (16 hex chars). Download: build `fileOf(log, device, new Date())` (device = a short summary of `navigator.userAgent`, e.g. platform and browser name); if `navigator.canShare?.({ files: [file] })` use `navigator.share`, else an `<a download>` with a Blob URL. New lang keys for every label.
- [ ] **Step 2: Run** `node --test` (PASS) and browser checks with `tools/shot.mjs`: Settings shows the toggle; with the log on (`--eval` toggling it), play a move via pointer events, reload, open Settings: "1 attempt logged" (or the right count) and no duplicate attempt in `localStorage['override-plays']` (print it via `--eval` into the console output, or read it in the same run); clicking Download in headless Chromium takes the fallback path without errors.
- [ ] **Step 3: Commit** `feat: opt-in play log with download`.

### Task 7: Play log report tool

**Files:**
- Create: `tools/plays.mjs`, `tests/plays-report.test.mjs` (or a sample fixture under `tests/fixtures/`)

- [ ] **Step 1: Implement** `node tools/plays.mjs <file> [file ...]`: per level: attempts, won, lost, left, median moves used (limit minus left for finished attempts), median bot `need`, median limit, waves per move, percent of 4+ wave moves; a total line. Export a pure `report(files: object[]) -> rows` used by the CLI so it can be tested.
- [ ] **Step 2: Test** `report` on a small fixture with known numbers.
- [ ] **Step 3: Run** `node --test` (PASS) and the CLI on the fixture.
- [ ] **Step 4: Commit** `feat: play log report tool`.

### Task 8: Docs

**Files:**
- Modify: `CLAUDE.md`, `docs/superpowers/specs/2026-11-11-core-loop-design.md` (fairness wording, pointer to the balance spec), `ROADMAP.md` (tuning section), `README.md` only if it describes balance

- [ ] **Step 1: Update** `CLAUDE.md`: refill section (`DAMP`, `landingCell`, damping applies to bot and player), levels (`GOAL`, blockers only with goals), sim columns, `src/plays.js`, `tools/plays.mjs`, keys (`override-plays`), cache `override-5`. Core spec: the "weights only add" fairness rule replaced by the restated rule from the balance spec. ROADMAP Tuning: `DAMP`, `GOAL`, and "use the play log".
- [ ] **Step 2: Run** `node --test` and `grep -c "—"` on changed docs (0).
- [ ] **Step 3: Commit** `docs: balance pass and play log`.
