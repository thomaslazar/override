# Board Shapes and Level Start Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Boards of any width and height (5 to 11 per side) on templates and plain levels, a trimmed play screen, and a level start screen before every level.

**Architecture:** Approach B from the spec: a w x h board lives top-left in an n x n grid (n = max(w, h)); the cells outside the rectangle are holes, so rules, gravity, check and bot keep working; only drawing and input crop to w x h. The play screen loses the comms overlay, the second log line and most of the photo strip; a sheet-based start screen shows the level, goals, moves and DECKER's line and replaces the loading card.

**Tech Stack:** vanilla ES modules, no build, no dependencies; `node --test`; `tools/sim.mjs`; `tools/shot.mjs` for screenshots.

**Spec:** `docs/superpowers/specs/2026-11-16-board-shapes-design.md`

## Global Constraints

- Width and height each 5 to 11; n = max(w, h); the board rectangle is anchored top left (padding rows at the bottom, padding columns at the right, never above).
- `S.w`, `S.h` are the visible rectangle; `S.n` stays the grid size. Square boards: `w = h = n`, behaviour unchanged.
- Padding cells are never drawn and take no input; holes inside the rectangle are drawn hatched as today.
- Cells at least 30 css px on 375 x 548 (`MAX_W`, `MAX_H` capped to what fits there).
- Balance target need about 8 + 14 d; median ratio near 92 %; prepare median about 0.4 s, at most about 2 s for levels 1 to 60.
- All visible text in `lang/en.json`; no em-dashes; typographic apostrophes (’) in visible text.
- No attribution lines in commits or docs. Conventional Commits.
- `docs/architecture.md` updated with each task's code. Spec wins over the plan.
- New site files go into the workflow copy step and `SHELL` in `sw.js` (rename `CACHE` if `SHELL` changes).
- Old saves: may load as squares (missing w, h default to n) or be dropped; take the smaller diff.

## Review Focus

- A mirrored non-square template must flip within its w columns, not within n (teleporters, spawners and drop points land on the right cells): Task 1 test.
- A wide board (padding rows at the bottom) must fill, spawn and let drops leave exactly like a square one; nothing ever falls into padding: Task 1 test.
- Rotating the phone or resizing mid-level must re-fit the board to its aspect without a stretched canvas: Task 3 screenshot check.
- A stuck worker on the start screen must still offer a reload after 20 s: Task 5 check.
- A reload while the start screen is open must show the start screen again and must not open a play-log attempt: Task 5 check.

---

### Task 1: Rectangles in the model, parse and check

**Files:**
- Modify: `src/core.js` (`validSave`, any 7..9 bound), `src/layouts.js` (`parse`, `check`, new constants), `tests/helpers.mjs` (`mk` may take ragged-free w x h rows: pad like parse)
- Test: `tests/layouts.test.mjs`, `tests/layout-core.test.mjs`, `tests/core.test.mjs`

**Interfaces:**
- Produces: `export const MIN_SIDE = 5, MAX_W = 11, MAX_H = 11` in `src/layouts.js`.
- Produces: `parse(t, mirror)` returns `{ n, w, h, cell, spawn, tp, exit, zone, drops }`; rows give h, tokens per row give w (all rows equal, else throw); n = max(w, h); cells outside w x h are holes in `cell`; mirror reverses tokens within the row (w wide).
- Produces: `check(L)` size rule: `w` and `h` within `MIN_SIDE..MAX_W` / `MIN_SIDE..MAX_H` (message `size WxH is outside ...`); other rules unchanged.
- Produces: `validSave` accepts n 5..11 and optional integers `w`, `h` with `MIN_SIDE <= w, h <= n` and `max(w, h) === n`; missing w, h mean square.

- [ ] **Step 1: Write failing tests**
  - `parse pads a non-square template`: a 6-wide, 9-tall template (all '.', top row 'S') parses to n 9, w 6, h 9; cells with column >= 6 are `cell` 1; spawners only in row 0, columns 0..5.
  - `parse mirrors within the width`: a 6 x 9 template with `iA` at (8, 0) and `eA` at (0, 5) mirrored puts the ingress at (8, 5) and the egress at (0, 0) (indices with n 9).
  - `a wide board fills and keeps padding empty`: 9 x 5 template, `gravity` on an empty board fills exactly the 45 rectangle cells; rows 5..8 stay null.
  - `drops leave on a tall board`: a 6 x 9 board via `mk` with a drop above a drop point leaves as on a square board.
  - `check: size per side`: 4 x 9 and 9 x 12 fail with a size message; 5 x 11 and 11 x 11 (valid shapes) pass the size rule.
  - `validSave: n 5..11 with w and h`: n 11 w 9 h 11 valid; w 12 invalid; w 4 invalid; max(w, h) !== n invalid; old save without w, h valid.
- [ ] **Step 2: Run `node --test`**: the new tests fail.
- [ ] **Step 3: Implement** the interfaces above.
- [ ] **Step 4: Run `node --test`**: all pass (existing square templates parse with w = h = n).
- [ ] **Step 5: Update `docs/architecture.md`** (state fields `w`, `h`; parse and check) and commit `feat: rectangular boards in the model, parse and check`.

### Task 2: Plain levels get rectangles

**Files:**
- Modify: `src/levels.js` (`paramsFor`, `patternScore`, `makeAttempt`), `tools/sim.mjs` (print `WxH` instead of n)
- Test: `tests/levels.test.mjs`

**Interfaces:**
- Consumes: Task 1 `MIN_SIDE`, `MAX_W`, `MAX_H`, `parse` result `w`, `h`.
- Produces: `paramsFor(level, fails, drop)` returns `{ d, k, w, h, n, enc, hp, fw }` (n = max(w, h)); `makeAttempt` sets `S.w`, `S.h` (from the template's `L.w`, `L.h`, else from params) and, on plain rectangles, `S.cell` with padding holes.

- [ ] **Step 1: Write failing tests**
  - `plain levels draw rectangles`: over levels 1 to 300, every plain level has `MIN_SIDE <= w <= MAX_W`, `MIN_SIDE <= h <= MAX_H`; at least 30 % have `w !== h`; tall (h > w) outnumber wide (w > h); the draw is deterministic (`paramsFor(l)` twice equal).
  - `rectangle boards are valid and playable`: for 40 plain levels with w !== h, `makeAttempt(l)` passes `validSave`, has no tile and no blocker outside w x h, and `hasMove`.
  - `patterns stay inside the rectangle and leave two free cells per row`: encrypted cells only at r < h, c < w, at most w - 2 per row.
- [ ] **Step 2: Run `node --test`**: fail.
- [ ] **Step 3: Implement.** Size draw from `hash(level, 1)`: keep today's area by difficulty (about 81 at low d, 49 to 64 later) and pick a shape for it, weighted about 35 % square, 45 % tall, 20 % wide (my call from the spec: "mostly square or taller, wide sometimes"). `patternScore(pattern, w, h, r, c)` centres on the rectangle; every `n`-based row and column bound in the pattern and firewall placement uses w and h; blocker counts scale with w x h, not n x n.
- [ ] **Step 4: Run `node --test`** and `node tools/sim.mjs 1-60`, then `node tools/sim.mjs 61-150`: median ratio near 92 %, no level over about 2 s in 1 to 60. Tune the size weights or area if not.
- [ ] **Step 5: Update `docs/architecture.md`** and `CLAUDE.md` (sim prints WxH) and commit `feat: plain levels on rectangles`.

### Task 3: Draw and touch only the board rectangle

**Files:**
- Modify: `src/ui.js` (`fit`, drawing loops, `cellAt`, effects that span rows or columns such as worm sparks and the finale)
- Check: `tools/shot.mjs` screenshots

**Interfaces:**
- Consumes: `S.w`, `S.h` (default `S.n`).
- Produces: `fit()` sets `cs = min(free width / w, free height / h)` (floored to whole css px is fine), canvas `w * cs` by `h * cs` css px, centred in `#wrap`.

- [ ] **Step 1: Implement** `fit`, skip drawing every cell with row >= h or column >= w (no hatch, no background), `cellAt` returns -1 outside w x h, worm and line effects stop at the rectangle edge.
- [ ] **Step 2: Run `node --test`** (no regressions).
- [ ] **Step 3: Screenshots** at 402 x 706, 375 x 548, 412 x 820 of a plain wide level, a plain tall level and a square template level (find levels with `node -e` over `paramsFor` / `boardFor`): the canvas has the board's aspect, no padding shows, the board is centred; resize 402 x 706 to 706 x 402 and back on one page with `--eval` (or two shots) and check the canvas re-fits.
- [ ] **Step 4: Update `docs/architecture.md`** (UI: fit, crop) and commit `feat: draw and touch only the board rectangle`.

### Task 4: Trim the play screen and cap board sizes

**Files:**
- Modify: `index.html` (remove `#comms` from the play screen, remove `#log2`), `style.css` (`#strip` thin band, `#log` rule), `src/ui.js` (drop `#log2` writes; keep the comms text function for Task 5), `src/layouts.js` (`MAX_W`, `MAX_H` if the measurement says so)

**Interfaces:**
- Produces: `comms()` no longer writes to the play screen; a function `commsLine(S)` returns `{ who, line }` (the text it computes today, including `hintCrack`, `hintFirewall`, `hintDrop` on `ENC_FROM`, `FW_FROM`, `DROP_FROM`) for Task 5.

- [ ] **Step 1: Implement.** `#strip` height about a third of today's (`clamp(110px, 22dvh, 200px)` today), lock and plug still readable; the win-time `open` art still shows. `#log2` gone; `#log` keeps its 620 px rule.
- [ ] **Step 2: Measure** the board space at 375 x 548 with `tools/shot.mjs --eval` (`#wrap` client size). Compute the largest h with `free height / h >= 30` for w up to 9 and the largest w with `free width / w >= 30`. If 11 does not fit, lower `MAX_H` / `MAX_W` in `src/layouts.js` to what does and add a "Changed in building" note to the spec.
- [ ] **Step 3: Screenshots** at the three sizes (square, tall and wide levels): strip thin, no comms overlay, board bigger than before.
- [ ] **Step 4: Run `node --test`**, update `docs/architecture.md` and `CLAUDE.md` (index.html and style.css descriptions), commit `feat: thinner photo strip, compact terminal, size cap`.

### Task 5: Level start screen

**Files:**
- Modify: `src/ui.js` (`begin`, `start`, `win`, `lose`, menu restart, level picker, boot), `index.html` / `style.css` (start screen styles in the sheet), `lang/en.json` (new keys)
- Remove: the loading card (`#loading`, `showLoading`, `hideLoading`) once nothing uses it.

**Interfaces:**
- Consumes: Task 4 `commsLine(S)`; worker `want`, `ready`, `keyOf`, `pickFor`, `prefetch` (unchanged: the next level and the next retry are still prepared during play).
- Produces: `brief(level, fails)` opens the start screen for that attempt; Start calls the existing start path (`S = s; logStart(true); ... start()`).

- [ ] **Step 1: Implement.**
  - Every start path calls `brief(level, fails)` instead of `begin`: win "next", loss "retry", menu restart, start over, level picker, `?level=N`, and boot when there is no level in progress. Boot with a saved level in progress resumes play (no start screen).
  - The screen (a sheet, never dismissable by tapping outside): chapter and level, goals with the same icons and counts as the HUD, the move limit, DECKER's line from `commsLine`, a Start button, and empty room below for later briefing text and items. The board is not visible behind it.
  - If the attempt is not ready: level number, a preparing line, Start disabled; fills in and enables when the worker answers. The 20 s guard still shows the reload offer.
  - The saved state while the screen is open records only the level and fails (as the save does today before an attempt exists), so a reload shows the start screen again; `logStart(true)` runs on Start, not on open.
  - Copy in `lang/en.json` (start button, preparing line, moves label); update `tests/lang.test.mjs` only if it lists keys.
- [ ] **Step 2: Run `node --test`.**
- [ ] **Step 3: Checks with `tools/shot.mjs`** at 402 x 706 and 375 x 548: start screen for level 1, level 6 (`hintCrack` line), level 21 (`hintDrop`), a tall board level; a reload (`?level` off, saved level without a state in progress) shows the start screen; play log on: no attempt until Start (`--eval` reading `override-plays`).
- [ ] **Step 4: Update `docs/architecture.md`**, commit `feat: level start screen`.

### Task 6: Non-square template library

**Files:**
- Modify: `src/layouts.js` (append templates), `tests/layouts.test.mjs` / `tests/levels.test.mjs` / `tests/bot.test.mjs` only where counts or named levels change
- Input: the research modules `cands2_a.mjs`, `cands2_b.mjs`, `cands2_c.mjs` in the session scratchpad (`/tmp/claude-1000/-home-ibn-Development-Override/14ead642-949c-4c8b-936a-a902d9e92c73/scratchpad/`), drawn as unpadded w x h rows.
- Create: `docs/research/2026-11-16-board-shapes-second-pass.md` (what was looked at, the candidates, which went in, which were dropped and why)

**Interfaces:**
- Consumes: Task 1 `parse` / `check` (non-square), Task 4 `MAX_W`, `MAX_H`.

- [ ] **Step 1:** Load every candidate, drop duplicates (same rows as an existing template or another candidate) and any over `MAX_W` / `MAX_H`, run `check` unmirrored and mirrored; keep those that pass. Give every kept template a unique name.
- [ ] **Step 2:** Append them to `TEMPLATES` under a comment `// third library: non-square (docs/research/2026-11-16-board-shapes-second-pass.md)`.
- [ ] **Step 3:** `node tools/sim.mjs 1-150`, then per template: tune `effort` and the band (as in the second library: effort roughly times 100 / average ratio), redraw drop boards whose drops get stuck (more drop points), and drop templates that stay over about 150 % or over about 2.5 s to prepare after two tuning rounds, or that fall back to another board. Repeat until median ratio about 92 % and no fallbacks.
- [ ] **Step 4: Run `node --test`**; fix tests that pin counts or named levels (keep their intent).
- [ ] **Step 5:** Write the research doc, update `docs/architecture.md` (template library summary) and the spec ("Changed in building" with the final count), commit `feat: non-square template library`.

After Task 6: whole-branch review, then `node --test`, `node tools/sim.mjs 1-60` and `1-150`, screenshots of five random levels at the three sizes, and hand the branch to the owner for testing (merge and push only on the owner's go).
