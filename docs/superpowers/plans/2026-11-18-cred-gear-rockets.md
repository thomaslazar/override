# Cred, gear, tools and rockets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A currency earned by winning (cred, ₡), a stock of gear and tools filled by loot and a shop, gear chosen
on the level start screen, tools used during a level, and a fourth special, the rocket.

**Architecture:** Rockets are a rules change in `src/core.js` (a new 2 x 2 match shape, a new special `'r'`, its
firing and combos), so the bot and the sim see them. Gear and tools are new pure functions in `src/core.js`
(`applyGear`, `tool`) used only by the UI; the bot never uses them. The economy (items, prices, payout, loot,
gear offers, the stock) is a new pure module `src/deck.js`. The UI keeps the stock in a new key `override-deck`.

**Tech Stack:** vanilla ES modules, canvas, `node --test`, no dependencies.

**Spec:** `docs/superpowers/specs/2026-11-18-cred-gear-rockets-design.md` (read it; it wins over this plan).

## Global Constraints

- Rules stay pure (no DOM, no storage) in `src/core.js`, `src/levels.js`, `src/deck.js`; seeded with `rngFor`/`hash`.
- Every `localStorage` key starts with `override-`; the new one is `override-deck`.
- All visible text in `lang/en.json`; no em-dashes in UI copy or docs; typographic apostrophes (’) in visible text.
- No dependencies, no build step. New site files go into `.github/workflows/pages.yml`'s copy step and `SHELL` in
  `sw.js` (then rename `CACHE` from `override-6` to `override-7`); `tests/shell.test.mjs` checks this.
- Commits: Conventional Commits, no attribution lines of any kind (no `Co-Authored-By`, no "Generated with").
- Keep `docs/architecture.md` in step with the code; `CLAUDE.md` holds development facts only.
- Run `node --test` (not `node --test tests/`) before each commit; after rule changes also `node tools/sim.mjs`.
- Seed channels already used: `rngFor(S.seed, 7|9|11|13|17|29)`, `rngFor(level, 4|31)`, `rngFor(l, 6)`. New ones:
  rocket targets `rngFor(S.seed, 19, ...)`, gear placement `rngFor(S.seed, 37, ...)`, loot `rngFor(level, 47)`,
  gear offer `rngFor(level, 53)`.
- Spec values: payout `floor(score / 100)` (replay: `floor((score - best) / 100)` if above best, else 0); prices worm 40,
  bomb 50, rocket 40, zero 100, moves 60, hammer 60, swap 80, shuffle 30; starter set 2 worm, 1 bomb, 1 rocket,
  1 hammer, 1 shuffle; no stock cap; single rocket fires 3; rocket + rocket fires 8; gear `moves` gives 3 to 5.

## Review Focus

1. A reload at any point (start screen with gear switched on, mid-level after a tool, the win screen) never pays
   cred twice, never refunds or double-spends an item. Pinned in Task 5 (payout once) and Task 6 (tool stock saved
   with the state).
2. A tool tapped while moves are 0, while the board animates, or after the win does nothing and keeps the item.
   Pinned in Task 4 (`tool` refuses at 0 moves and after a win) and Task 6 (UI gate).
3. Rocket targets on a board with holes, teleporters and drops: never a drop, never a dead cell, never the same cell
   twice, fewer targets than rockets on a near-empty board is fine. Pinned in Task 1.
4. A freshly dealt board and every refill settle contain no 2 x 2 square (it would be a free match). Pinned in Task 1.
5. Gear on a board with few plain tiles (many drops, firewalls, encrypted cells): places what fits, never on a
   drop, firewall or encrypted cell, never creates a match. Pinned in Task 4.

---

### Task 1: Rockets in the rules (square match, making, firing)

**Files:**
- Modify: `src/core.js` (`findGroups`, `specialOf`, `spotOf`, `lineAt`, `fillBoard`, `area`, `wave`, `tap`, `validTile`)
- Create: `tests/rockets.test.mjs`
- Modify: `docs/architecture.md`

**Interfaces:**
- Produces: special `'r'` (a coloured tile `{ t, s: 'r' }`); runs in `findGroups` gain `{ sq: true, cells: [4 cells] }`
  for squares; `rocketTargets(S, from, count, exclude: Set) -> number[]` (exported, used by Task 2).

- [ ] **Step 1: Write failing tests in `tests/rockets.test.mjs`** (build boards with `mk` from `tests/helpers.mjs`; add
  `'r'` to its token regex so `'Ar'` is a red rocket):
  - `a 2x2 square of one colour is a group and makes a rocket`: `findGroups` finds the 4 cells; `specialOf` gives `'r'`.
  - `a square sharing a cell with a line merges; the stronger special wins`: square + 3-line through it gives `'b'`
    when the line crosses, a 5-line gives `'z'`, a 4-line gives a worm; a square apart from a line is its own group.
  - `swapping into a square is a legal move and makes a rocket on the swapped cell`.
  - `a rocket matches by colour and fires when matched` (rocket in a 3-line fires, `step.fired` holds `s: 'r'`).
  - `a fired rocket hits 3 distinct targets in preference order`: board with one firewall, one encrypted cell, a
    tile goal colour: first target the firewall, second the encrypted cell, third a goal-colour tile.
  - `rocket targets are never drops, holes, blocks or cells the wave already clears; fewer cells, fewer targets`.
  - `the tile under a drop is preferred over a random tile` (no blockers, no tile goal).
  - `fillBoard and the refill damping leave no 2x2 square` (500 seeded `fillBoard` runs: `findGroups` empty).
  - `a double tap fires a rocket in place for one move` (`move(S, i, i)`).
  - `validSave accepts 's: "r"' tiles`.
- [ ] **Step 2: Run `node --test tests/rockets.test.mjs`**, expect failures.
- [ ] **Step 3: Implement.**
  - `findGroups`: after the line runs, add every 2 x 2 block of one colour (colourAt, so zero-days and drops never
    match) as a run `{ sq: true, cells }`; the existing merge joins runs sharing a cell.
  - `specialOf(g, swipe)`: unchanged order for lines (z, b, worm) using only line runs; else `'r'` when the group has
    a square run; else null.
  - `spotOf(g, 'r', prefer)`: a preferred (swapped) cell in the group, else the square's top-left cell.
  - `lineAt(S, i)` (used by `swapLegal`, `setsUp`, `damp`): also true when `i` is in a 2 x 2 block of its colour.
  - `fillBoard`: also reject colour `t` at `(r, c)` when `(r-1,c-1)`, `(r-1,c)`, `(r,c-1)` all have colour `t`.
  - `rocketTargets(S, from, count, exclude)`: candidates are cells with a tile or encrypted value, not dead, not a
    drop, not in `exclude`, not `from`; tiers in order: firewalled tile (`lock`), encrypted cell (`S.enc[i] > 0`), tile
    whose colour a `tiles` goal still needs, the tile directly below a drop (`i - S.n` holds a drop), any other tile;
    pick within a tier with `rngFor(S.seed, 19, S.spawns, from, k)`; distinct; stop when candidates run out.
  - `area(S, i, x)` for `'r'`: `[...rocketTargets(S, i, 3, cells)]` where `cells` is the wave's set (pass it in) plus `i`.
    Rocket targets are hit like blast cells (cleared, unlocked, or cracked one layer).
  - `tap`: allow `'r'` (still not `'z'`).
  - `validTile`: allow `'r'` with a colour.
- [ ] **Step 4: Run `node --test`** (all tests; older tests that assumed no square match may need a board tweak:
  change the board, never the assertion's meaning) and `node tools/sim.mjs 1-30`; expect it to run without errors.
- [ ] **Step 5: Update `docs/architecture.md`** (matching, specials, targets) and commit
  `feat: rockets from 2x2 squares, fired at targets that matter`.

### Task 2: Rocket combos, drawing and balance

**Files:**
- Modify: `src/core.js` (`combo`), `src/ui.js` (draw the rocket, the flight, combo flash), `tests/rockets.test.mjs`,
  `docs/architecture.md`, `tools/sim.mjs` only if a column needs it.

**Interfaces:**
- Consumes: `rocketTargets` from Task 1.
- Produces: combo kinds `'rr'`, `'rw'`, `'rb'`, `'zr'` in `{ k: 'combo', kind }` steps; wave steps for rockets carry
  `rockets: [{ from, to }]` so the UI can draw flights.

- [ ] **Step 1: Failing tests in `tests/rockets.test.mjs`:**
  - `rocket + rocket fires 8 rockets` (8 distinct targets on a 9 x 9 board).
  - `rocket + worm: 3 targets, each sets off a worm there` (cleared includes a full row or column through each target).
  - `rocket + bomb: 3 targets, each sets off a 3x3 blast there`.
  - `rocket + zero-day turns every tile of the rocket's colour into a rocket and fires them all`.
  - `a rocket wave step lists its flights` (`rockets.length === 3`, each `from` the rocket cell).
- [ ] **Step 2: Run, expect failures.**
- [ ] **Step 3: Implement** in `combo`: `'rr'` → `rocketTargets(S, pa, 8, cells)`; `'rw'`/`'rb'` → 3 targets, then add
  the worm area (direction from `rngFor(S.seed, 19, S.spawns, t)`) or the 3 x 3 square around each target;
  `'zr'` → like `'zw'` but converts to `'r'`. Record flights on the wave step.
- [ ] **Step 4: UI.** Draw `'r'` in `drawTile` as a small rocket glyph in the tile's colour (terminal style, code-drawn
  like `drawWorm`/`drawBomb`); a flight effect (a short bright streak from `from` to `to`, about 180 ms) before the
  hits pop; combo flashes for the new kinds. Check with `node tools/shot.mjs` at 402 x 706 on a level where a rocket
  appears (use `--eval` to run moves if needed) and look at an enlarged crop.
- [ ] **Step 5: Balance.** Run `node tools/sim.mjs 1-150`. Keep the median ratio near 100 % and prepare time median
  about 0.45 s, max about 3 s. If the ratio drops below 90 % or rises above 110 %, adjust `K`/`C` in `src/bot.js`
  and re-run. Record the summary line in the commit message body.
- [ ] **Step 6: Docs and commit** `feat: rocket combos, rocket drawing and flights`.

### Task 3: The economy module (`src/deck.js`)

**Files:**
- Create: `src/deck.js`, `tests/deck.test.mjs`
- Modify: `.github/workflows/pages.yml` copy step, `sw.js` (`SHELL`, `CACHE` → `override-7`), `docs/architecture.md`, `CLAUDE.md`

**Interfaces:**
- Produces (all pure):
  - `ITEMS`: `[{ id, kind: 'gear'|'tool', price }]` for `worm, bomb, rocket, zero, moves, hammer, swap, shuffle`.
  - `STARTER = { worm: 2, bomb: 1, rocket: 1, hammer: 1, shuffle: 1 }`.
  - `deckFrom(o) -> { cred, items }`: validates a stored value (non-negative integers, known ids only); invalid or
    missing → `{ cred: 0, items: { ...STARTER } }` with every id present (0 where absent).
  - `payout(score, best) -> number`: `best == null ? floor(score/100) : max(0, floor((score - best)/100))`.
  - `lootFor(level) -> id | null`: seeded `rngFor(level, 47)`; always when `chapterOf(level).pos % 5 === 0` or it is the
    chapter's last level; 0.35 when `difficulty(level)` is among the top 10 of its chapter's 30; else 0.10. Weights:
    shuffle 3, worm 3, rocket 2, bomb 2, hammer 2, moves 2, swap 1, zero 1.
  - `gearFor(level) -> [{ id, n? }]`: 3 distinct ids from `worm, bomb, rocket, zero, moves` via `rngFor(level, 53)`;
    `moves` carries `n` in 3..5.
  - `buy(deck, id) -> boolean`, `take(deck, id) -> boolean` (spend one from stock), `add(deck, id, k = 1)`.
- [ ] **Step 1: Failing tests:** payout cases (first win 3,870 → 38; replay 5,000 over best 3,870 → 11; replay below
  best → 0; score 99 → 0); `deckFrom` (missing → starter, bad values → starter, unknown ids dropped, numbers kept);
  `lootFor` stable per level, always on level 5, 30, 35; overall rate across levels 1-300 between 0.15 and 0.35;
  `gearFor` stable, 3 distinct, `moves` n in 3..5; `buy` spends cred and adds one, refuses when short; `take` refuses at 0.
- [ ] **Step 2: Run, expect failures.** **Step 3: Implement.** **Step 4: `node --test` passes.**
- [ ] **Step 5: Docs** (`architecture.md` module entry; `CLAUDE.md` files list and the `override-deck` key) **and commit**
  `feat: cred, stock, loot and gear offers (pure)`.

### Task 4: Gear and tools in the rules (`applyGear`, `tool`)

**Files:**
- Modify: `src/core.js`, `docs/architecture.md`
- Create: `tests/gear.test.mjs`

**Interfaces:**
- Consumes: specials `'h' | 'v' | 'b' | 'r' | 'z'`.
- Produces:
  - `applyGear(S, gear: [{ id, n? }]) -> void`: ids `worm|bomb|rocket|zero` turn one random plain tile each
    (no special, no drop, no lock, cell not encrypted) into that special, keeping its colour (zero-day: `t: -1`);
    worm direction from the seed; `moves` adds `n` to `S.moves` and `S.limit`; records `S.gear = gear.map(g => g.id)`.
    Seed `rngFor(S.seed, 37, k)`.
  - `tool(S, kind: 'hammer'|'swap'|'shuffle', a?, b?) -> { ok, steps }`: refuses (`ok: false`, no change) when
    `S.moves <= 0` or `won(S)`. hammer: `a` must hold a tile that is not a drop, or be an encrypted cell; firewall →
    unlock only; encrypted → one layer; else a one-cell wave (a special fires); then gravity and cascade (chain 2).
    swap: `a`, `b` neighbours, both movable (drops allowed, locked not); swap, then resolve as `move` would without
    `spend` and without the revert (two specials → combo; matches → cascade; nothing → stays). shuffle: `reshuffle(S, steps)`.
    All: no move spent; afterwards, if not won and no move left, the free reshuffle.
  - `validSave` accepts optional `gear` (array of known ids).
- [ ] **Step 1: Failing tests in `tests/gear.test.mjs`:** `applyGear` places each special on a legal cell, keeps colour,
  creates no match (`findGroups` empty), same seed same cells, `moves` adds to moves and limit, a board with 1 plain
  tile places only 1 special; hammer clears a goal tile and counts it, unlocks a firewall, cracks one layer, refuses a
  drop, a hole and an empty cell; swap moves a drop across without a match and stays swapped, resolves a combo when
  both are specials, refuses a firewalled tile; shuffle keeps drops; none spends a move; all refuse at 0 moves and
  after a win; a hammer that completes the goals wins (`won(S)`).
- [ ] **Step 2-4:** run (fail), implement, `node --test` passes.
- [ ] **Step 5: Docs and commit** `feat: gear placement and in-level tools in the rules`.

### Task 5: Start screen gear, shop, loot and payout (UI)

**Files:**
- Modify: `src/ui.js` (`brief`, `win`, storage, cred icon), `style.css`, `lang/en.json`, `src/plays.js`,
  `tests/plays.test.mjs`, `docs/architecture.md`

**Interfaces:**
- Consumes: `deck.js` (Task 3), `applyGear` (Task 4).
- Produces: `deck` (module state in `ui.js`, loaded with `deckFrom(JSON.parse(store.get('override-deck')))`, saved with
  `saveDeck()`); play log attempts gain `gear: string[]` (`attemptOf` reads `S.gear`).

- [ ] **Step 1: Failing test in `tests/plays.test.mjs`:** `attemptOf` copies `S.gear` (empty array when absent).
- [ ] **Step 2: Start screen.** Below the goals and moves: cred (`₡` icon + amount), the three `gearFor(level)` slots
  (icon, owned count, on/off; a slot not owned shows its price and can be switched on only if the cred covers all
  switched-on unowned slots), "Loot on first win: {item}" when `lootFor(level)` and the level has no stored best,
  and a Shop button. Slots reset to off on every visit (retries included). On Start: take owned items from stock,
  pay unowned ones, `applyGear(S, chosen)`, `saveDeck()`, then the existing start path (save, log).
- [ ] **Step 3: Shop sheet** (from the start screen only): one row per `ITEMS` entry: icon, name, one-line effect,
  owned, price, Buy (disabled when short). Back returns to the start screen without losing the switched-on slots.
- [ ] **Step 4: Win payout.** In `win()`: `const prev = bestOf(level)`; cred `payout(score, prev)`; loot when
  `prev === null`; update best, cred and stock and save both keys before showing; show `+ ₡ n` and
  "{item} added" rows. A reload of a won level (best already stored) pays 0.
- [ ] **Step 5: Cred icon** drawn in code (a C with two vertical strokes), used inline wherever cred shows; item
  icons drawn like the board pieces (gear: the special; tools: simple hammer, swap arrows, shuffle glyphs).
- [ ] **Step 6: Text** in `lang/en.json` (item names and effects, Shop, Buy, Owned, Loot line, gear slot labels, cred
  amounts); `tests/lang.test.mjs` passes.
- [ ] **Step 7: Check in the browser** (`python3 tools/serve.py`, `node tools/shot.mjs` at 402 x 706, 375 x 548,
  412 x 820): start screen with slots, the shop, a win with payout (`--won`). Look at enlarged crops.
- [ ] **Step 8: Docs and commit** `feat: cred, shop, loot and gear on the level start screen`.

### Task 6: Tool bar during a level (UI) and wrap-up

**Files:**
- Modify: `src/ui.js` (tool bar, arming, input, animation, save), `index.html`, `style.css`, `lang/en.json`,
  `src/plays.js`, `tests/plays.test.mjs`, `docs/architecture.md`, `ROADMAP.md`

**Interfaces:**
- Consumes: `tool` (Task 4), `deck`/`saveDeck` (Task 5).
- Produces: play log move entries for tools: `entryOf(S, steps, n)` plus `tool: kind` (the move number does not
  advance the limit; `n` stays the entry index).

- [ ] **Step 1: Failing test in `tests/plays.test.mjs`:** a tool entry carries `tool` and the usual counts.
- [ ] **Step 2: Tool bar** in `#soft` next to Menu: three buttons (icon + count, `aria-label` from `lang`), dimmed at 0
  or when moves are 0, while animating, or after the level ended. Tap arms (highlight), tap again disarms.
  Armed hammer: next board tap is the target. Armed swap: tap or drag two neighbours. Shuffle runs at once.
- [ ] **Step 3: Running a tool** mirrors `play()`: `tool(S, ...)`; when `ok`, `take(deck, kind)`, `saveDeck()`, `save()`,
  log the entry, animate the steps (the shuffle step exists already), then the usual win check (a win runs the
  finale). When not ok, the item stays and the tool disarms with a short toast.
- [ ] **Step 4: Browser check** (as Task 5) of the tool bar at the three sizes, a hammer on a firewall and a swap of a drop.
- [ ] **Step 5: `ROADMAP.md`:** move "Funds, gear and shop" to Done (with rockets), and add "More specials (from
  `docs/research/2026-11-18-specials-and-boosters.md`)" to Next. Docs and commit
  `feat: tool bar with hammer, swap and shuffle`.
