# Architecture

How the code is built: modules, state, algorithms and the UI's moving parts. Game rules and
design decisions live in the specs under `docs/superpowers/specs/` (the core loop spec wins on
rules, the visual overhaul spec on looks); setting and fairness in `docs/HANDOVER.md`. Keep
this file in step with the code.

## Core (`src/core.js`)

Sections are marked `/* ---------- name ---------- */`. `S` is a plain, JSON-safe attempt (shape in
the spec): `n` board side (7..9), `k` colours, `types` glyph slot per colour, `grid` (tile or
null, index `r * n + c`), `enc` (encrypted hits left per cell), `goals`, `moves`, `limit`,
`need`, `seed`, `salt`, `drop`, `deal` (which seeded board), `pick` (set by the UI), counters `spawns`, `shuffles`, `ids`, and `nice` (helpful refill on for the
player, off for the bot). A tile is `{ id, t, s, lock }`; `s` is `null`, `'h'`/`'v'` (worm),
`'b'` (logic bomb) or `'z'` (zero-day, `t === -1`); `lock` is a firewall.

- **random**: `mulberry32`, `hash`, `rngFor`. No `Math.random` anywhere in `src/`.
- **matching**: `findGroups` merges horizontal and vertical runs of 3+ that share a cell into
  one group; encrypted cells, empty cells and zero-days never match. `specialOf(group, swipe)`:
  5+ run makes a zero-day, an L or T (a horizontal and a vertical run) a bomb, a run of 4 a
  worm along the swipe (or its own direction). `spotOf` puts it on a swapped cell, else the
  crossing (bomb), else the middle of the longest run. `swapLegal` needs a match, or a special.
- **move**: `move(S, a, b)` returns `{ ok, steps }`. Steps are `swap`, `back`, `combo`,
  `convert`, `wave`, `fall`, `shuffle` (contract in the plan). Flow: swap; a lone worm or bomb
  swapped into a match joins that match's first wave (so the special it makes survives); any
  other swap with a special is a `combo` then cascade; a plain match spends the move and cascades; no match swaps
  back and costs nothing. After a cascade, if goals are not met and moves remain but no move
  exists, `reshuffle` runs.
- **combos**: `ww` row and column, `bw` three rows and three columns, `bb` 5x5, `zw`/`zb`
  zero-day with a worm or bomb converts every tile of that colour into worms (random h or v) or
  bombs, then fires them, `zz` clears the board. Zero-day with a plain tile clears that colour.
  A zero-day fired by a blast clears a random colour still on the board (seeded by its id).
- **wave**: fires specials in a chain (each id once), cracks encrypted cells (hits from a fired
  area, plus matched neighbours), unlocks firewalled tiles (a firewalled tile hit is unlocked,
  not cleared), clears the rest and counts goals, then places the new specials. A special
  created on a cell whose firewalled tile was only unlocked consumes that tile: it appears in
  the wave's `cleared` and counts for the tiles goal.
- **gravity**: passes until stable: straight down, spawn in row 0 with `spawnColour`, diagonal
  fill for cells not fed from above (a cell under an encrypted cell or firewalled tile).
  Roofed pockets stay empty. Encrypted cells and firewalled tiles never move. Damping at settle time:
  each tile spawned in a gravity call that ends up in a line keeps its colour with chance `DAMP` (0.2),
  else is recoloured (seeded) to a colour that makes no line (kept if none exists), and their spawn records are patched. Player and
  bot share it, so the bot-set limits cover it.
- **refill** (here, not in `levels.js`, to avoid an import cycle): `REFILL = { A: 1.5, B: 0.5, M: 2 }`.
  `pressure(S)` is 0 when goal progress keeps pace with moves used, up to 1 when far behind (0
  without a limit). `setsUp(S, i, t)` is true when colour t at i makes a near pair without a
  direct match (no free cascades). `refillWeights` start at 1; with `nice`, +`A` + `M * pressure`
  for a colour that sets up a pair, +`B` for a colour a tiles goal still needs. Weights only
  ever add; the only thing against the player is the shared settle-time damping (see gravity). `spawnColour` draws from `rngFor(S.seed, 7, S.spawns++)`.
- **reshuffle**: seeded shuffle of movable tiles until there is no match and a move exists;
  after 200 tries it also redraws plain colours (400 max).
- **score**: `SCORE = { tile: 10, crack: 20, unlock: 30, create: 50, fire: 50, zero: 100, chainCap: 5 }`.
  `pointsOf(step, chain)` sums a wave's cleared tiles, cracks, unlocks, created and fired specials
  (a fired zero-day at `zero`), times the chain factor: the wave's place in the cascade (1 for the
  move's first wave), capped at `chainCap`. Each wave step carries `points`; `S.score` is the total
  (a save without it loads as 0). The score never decides win or loss.
- **finale**: `finale(S)` (precondition `won(S)`) sets `S.spare` to the moves left and `S.moves` to 0,
  then returns `{ steps }` starting with a `{ k: 'finale' }` marker: every special on the board fires
  (a wave, then gravity and cascade, repeated until none is left, 500 rounds max), then each spare
  move turns a seeded random plain, unlocked tile into a bomb (1/3) or worm (h or v) with a
  `convert` step and fires the board again. Its gravity is calm (no settle-time damping), so lucky
  lines are allowed. All of it scores; the result is fixed when the level is won.
- **saves**: `validSave` (version `v: 1`), `toSave`, `fromSave`; an invalid save is dropped.


## Levels (`src/levels.js`)

- Chapters of `CHAPTER` = 30 levels. `difficulty(level)` ramps over the chapter from a base
  (`min(.25, .05 * (chapter - 1))`) to .85, +.1 on every 5th level, -.1 on the level after
  (`breather`). Encrypted cells from `ENC_FROM` (4), firewalls from `FW_FROM` (7).
- `paramsFor(level, fails, drop)` gives `{ d, k, n, enc, hp, fw }`: colours 5, or 6 (d > .8), minus
  one from the 6th fail (min 4, so 4 only by retry easing); board 7..9 by
  difficulty and `hash(level, 1)`; encrypted cell count, hits and firewall count scale with `d`.
  `drop` lowers `d` (the bot's easing). Tune by playtest.
- `makeAttempt(level, fails, salt, drop, deal)`: layout (encrypted cells in mirrored pairs from row
  2, firewall spots, goals) depends on level, salt and drop; tiles on `deal`, not on fails, so a deal is
  the same board on every retry until easing drops a colour. Goals use the
  fails-0 colour count for their size, and goal colours never include the colour that easing
  drops from the 6th fail. Goal kinds are decided first and blockers are placed only with their goal
  (no crack goal, no encrypted cells; no firewall goal, no firewalls); level `FW_FROM` always gets a
  firewall goal. Tile goals are `GOAL` (1.2) times the base size. Goal kinds: `crack` (all encrypted cells), `firewall`, `tiles` (one
  colour, or two at 60% each on harder levels).


## Bot (`src/bot.js`)

- Constants: `CAP` 80 (moves before giving up), `K` 1.3, `C` 2 (the human factor), `RUNS` 3,
  `SALTS` 10, `MIN_LIMIT` 10. The salt search stops a salt at its first capped run (same results).
- `pick(S, rnd)` (exported): one-move lookahead. Every legal move in both directions is played
  on a copy whose seed is `hash(991, S.level, S.spawns, S.moves)`, independent of the real
  refill seed, so the bot cannot see future refills. Value: goal progress first (1000 per
  goal), +15 per special on the board, +.5 per tile spawned, plus a tiny random tie-break.
- `solve(S, seed, nice)` plays a copy to a win with no limit (`Infinity` at `CAP`).
- `limitFor(need, fails)` = `max(MIN_LIMIT, ceil(need * K + C))`, then +10% per fail from the
  4th, capped at +40%.
- `prepare(level, fails, pick)`: the first call for a level tries salts 0..9 on deal 0, then lowers difficulty by `drop`
  steps of 0.1, until all `RUNS` bot runs finish (layout and goals). Then the bot plays `DEALS` (12) seeded tile boards
  (deals) of that layout once each; the easiest and the hardest are dropped, the median sets `need` for every attempt
  of the level, and up to `KEEP` (10) deals are kept. `{salt, drop, need, deals}` is memoised (last 8 levels). An
  attempt plays `deals[pick % deals.length]` with `limitFor(need, fails)`, so the move count only changes by the fail
  easing. The bot plays with `nice` off.


## Worker and UI (`src/worker.js`, `src/ui.js`)

- Boards: each attempt plays one of a level's 10 deals by `pick` (stored in `S.pick`). A level's first attempt
  picks at random (`crypto`), every retry or restart takes the next (mod 10), so a board repeats only after 10
  attempts. The next level's pick is fixed when it is prefetched.
- Worker protocol: the UI posts `{ level, fails, pick }`, the worker answers `{ level, fails, pick, S }`
  from `prepare`, in order. `worker.onerror`/`onmessageerror` hide the loading card and show a
  non-dismissable "Reload" sheet. The UI keeps `ready` (answers by `level:fails:pick`), `ask` (once per
  key), `want` (a promise for the latest key only, delivering a copy) and `prefetch(level,
  fails, pick)`, which asks for the next level and the next retry after every start.
- `begin(level, fails)`: picks the board, closes sheets, shows the loading card if the answer is not ready
  (at least 400 ms; after 20 s it shows the Reload sheet instead of hanging), sets `S`, `run.best` and `run.fails`, saves, then `start()`. Next level is
  `begin(level + 1, 0)`; Try again is `begin(S.level, S.fails + 1)`; Restart level (menu, asks
  first) is `begin(S.level, S.fails)`, not a fail.
- View model: `sprites` (by tile id, with target `tx`, `ty`), `vEnc`, `fx`. `sync()` rebuilds
  the view from `S`; it runs at level start and after every move's animation, so the view
  always equals the state. `animate(steps)` plays the `move` steps in order (swap and back,
  combo flash, convert, wave with flashes, cracks, unlocks, pops and created specials (blasts: worm beams
  shoot out both ways, bombs flash and send two shock rings, sparks fly from every fired special and cleared
  tile, the board shakes; `BOOM.spark`/`BOOM.shake` scale it), fall (a run of
  gravity passes plays as one drop: tiles accelerate, `GRAV`, and hop once on landing, `HOP`; new
  tiles start stacked above the board), shuffle with a toast). `animate(steps, speed)`: `speed` divides every
  wait and speeds tile motion (`pace`). `play(a, b)` calls `move`, logs the move (before the finale), runs
  `finale(S)` at once if the move won, saves (closing mid-cascade or mid-finale loses nothing), animates the
  move, then `playFinale`, syncs, then shows the win or loss sheet. A won save without `spare` (from before
  the finale) runs `finale` silently at boot.
- Finale: `playFinale(steps)` shows the `finaleToast`, then plays the steps sped up so the whole finale takes
  at most about `FINALE_MS` (10 s; `finaleMs` estimates the normal length from `STEP_MS`). A tap anywhere
  (document capture `pointerdown`, ignores the grace, stops the event) skips: the animation stops at the next
  step and `sync()` shows the saved end state. Reduced motion skips the animation.
- HUD score: `#score` under the goals shows `score n`, plus `· best n` when the level has a best
  (`fmt` groups digits with a thin space). While a move animates, `shown` holds the HUD's score and
  moves: it starts at the score before the move and the moves left after it, each wave step adds its
  `points`, and each finale `convert` step spends one spare move, so the count ends at `S.score` and 0;
  `sync()` then clears it.
- Best scores: `override-best` is `{ "<level>": score }`, read once at boot (junk becomes `{}`);
  `bestOf(level)` is an integer or `null`. `win()` reads the previous best, then stores the higher one.
- Win rows: below the win text, a grid of `score` (large, glowing, counting up from 0 over 1.2 s, eased),
  `best` (the previous best; omitted on a first win) with dotted leaders, then `>> NEW BEST <<` (amber,
  blinking with `alertflash`) when beaten. A tap on the sheet ends the count-up. Reduced motion shows the
  final number at once and no blink.
- Input: pointer down then drag past a third of a cell swaps with that neighbour; tap a tile,
  then an adjacent tile, also swaps. Gates: `busy`, a 400 ms `grace` after a sheet closes or a
  level starts, any open sheet or menu (`blocked()`), a won or lost state.
- Hint: after `HINT_MS` (10 s) without input, if the board has at most `HINT_MAX` (2) legal swaps, the first
  (`validMoves`) wriggles, the two tiles nudging toward each other; reduced motion outlines them instead. Input,
  moves, sheets and the menu reset the wait.
- Patrol warnings: the move count turns amber at 25 % of the limit and red (pulsing) at 3 or fewer; crossing
  either line during a move flashes `#alert` once, centred ("Patrol closing in", "Patrol at the door"),
  never on the winning move and never on load.
- Sheets: one sheet for win ("Door’s open" with a note at a new chapter), loss (Try again) and
  the confirmations. The menu has tabs Run (level picker up to the best level, or `MAX_LEVEL` 9999 on
  a local build, via `clampLevel` in `src/levels.js`; best level; Restart level; Start over, which keeps the best level), Settings
  (language, colours standard/colour-blind, Play log: on/off, attempts count, Download log, Clear log;
  `override-plays`, opt-in, `src/plays.js`) and Info (how to play, Share, GitHub, licence, font).
- Look: dark only, a hacker terminal. The strip shows the obstacle plate (locked; `unlockScene`
  toggles `#strip.open` for the open plate on a win). The canvas draws tiles as glowing
  characters (`GLYPHS` ロ ハ メ ト Ξ ミ ム, one per slot) so colour is never the only cue; specials are `drawWorm`
  (data packet along its line), `drawBomb` (chip with lit pins), `drawZero` (turning ring in the
  level's colours); blockers are `drawEnc` (static slab, amber outline for hits left) and
  `drawFw` (flames and cage bars). Effects: worm streak, bomb shockwave, area flash, crack.
  Sheets, menu, loading card and toast are terminal windows; the win sheet has the `PADLOCK`
  and `PWNED` art (`animateArt`, decoration, not translated). `prefers-reduced-motion` skips idle
  animation, effects and cycling (win art static). Tile colours come from `paletteFor`.
- Saving: `override-v1` holds `S` whole, written after every move. `override-run` is
  `{ best, fails }`. `override-best` holds the best score per level. A save that fails `validSave` but holds an integer `level` restarts that
  level fresh (keeping a valid `fails`). `?level=N` works off GitHub Pages only (`DEV`).
- Text is `t(key, {placeholders})` over `lang/en.json`; never put visible text in code.
