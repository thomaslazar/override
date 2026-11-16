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
`'b'` (logic bomb) or `'z'` (zero-day, `t === -1`); `lock` is a firewall. A drop tile is
`{ id, t: -1, s: null, lock: false, d }` (`d` its kind, `0..DROP_KINDS - 1`, `DROP_KINDS = 3`; `isDrop(x)`).
Optional static layout (absent on square boards and old saves): `cell` (per cell `0` live, `1` hole,
`2` block; `dead(S, i)`) and `spawn` (`[{ i, d }]`, `d` drop kind or `-1`; `isSpawner(S, i)`, which
without `spawn` means every live top-row cell). A dead cell never holds a tile, never fills and is
never matched; blasts pass over it. `tp` (`[[ingress, egress]]`): one-way teleporters; `above(S, egress)`
is the ingress and `above` of the cell below an ingress is `-1`, so gravity and its fed test follow them while
diagonal slides, matches and blasts keep to board adjacency. `validSave` checks all three when present
(a dead cell must be empty; spawners and teleporter cells are live, a spawner cell appears once, a
teleporter cell once across all pairs, pairs are complete). `exit` (drop point cells, live, each once) and
`drops` (`{ every, wait }`: a drop every `every` moves, `wait` counting moves since the last one; `every: 0`
means the next comes once no drop is on the board) are optional too; `validSave` checks them, drop tiles
and drop goals `{ kind: 'drop', d, need, got }`.

- **random**: `mulberry32`, `hash`, `rngFor`. No `Math.random` anywhere in `src/`.
- **matching**: `findGroups` merges horizontal and vertical runs of 3+ that share a cell into
  one group; encrypted cells, empty cells, zero-days and drops never match. `specialOf(group, swipe)`:
  5+ run makes a zero-day, an L or T (a horizontal and a vertical run) a bomb, a run of 4 a
  worm along the swipe (or its own direction). `spotOf` puts it on a swapped cell, else the
  crossing (bomb), else the middle of the longest run. `swapLegal` needs a match, or a special.
  A swap with a drop is legal when the other tile lands in a line, or is a worm or bomb (it fires); a zero-day
  needs the line; drop with drop never.
- **move**: `move(S, a, b)` returns `{ ok, steps }`. `a === b` taps a worm or bomb: it fires in place for one
  move (a `wave` from that cell, gravity, cascade at chain 2); a zero-day, a locked or a plain tile is not ok. Steps are `swap`, `back`, `combo`,
  `convert`, `wave`, `fall`, `exit`, `shuffle` (contract in the plan). Flow: swap; a legal swap with a drop
  resolves as the other tile's match (no combo), or fires the worm or bomb like a lone special swap; a lone worm or bomb
  swapped into a match joins that match's first wave (so the special it makes survives); any
  other swap with a special is a `combo` then cascade; a plain match spends the move and cascades; no match swaps
  back and costs nothing. After a cascade, if goals are not met and moves remain but no move
  exists, `reshuffle` runs.
- **combos**: `ww` row and column, `bw` three rows and three columns, `bb` 5x5, `zw`/`zb`
  zero-day with a worm or bomb converts every tile of that colour into worms (random h or v) or
  bombs, then fires them, `zz` clears the board. Zero-day with a plain tile clears that colour.
  A zero-day fired by a blast clears a random colour still on the board (seeded by its id).
- **wave**: fires specials in a chain (each id once), cracks encrypted cells (hits from a fired
  area, plus neighbours of matched cells and of a zero-day's tiles), unlocks firewalled tiles (a firewalled tile hit is unlocked,
  not cleared), clears the rest and counts goals, then places the new specials. A special
  created on a cell whose firewalled tile was only unlocked consumes that tile: it appears in
  the wave's `cleared` and counts for the tiles goal. No wave clears a drop (blasts and zero-days pass it
  by; a zero-day's random colour is never a drop's).
- **gravity** (exported): passes until stable, bottom row first: an empty live cell takes the tile from
  `above(S, i)` if movable, else spawns with `spawnColour` if it is a spawner, else fills diagonally
  unless fed (going up via `above` reaches a spawner without a dead cell, encrypted cell or
  firewalled tile; `reaches`, memoised per cell, a cell marked unfed while its own walk runs, so a
  teleporter loop counts as unfed). Dead cells count as occupied when choosing a diagonal source; a source whose upward walk meets the empty cell is skipped (it is fed from that column through a teleporter, so taking from it would cycle the same tiles between two columns). At most
  `8 n n` passes, so a teleporter loop (templates must not have one) cannot cycle a gap forever.
  Per settle it caches `above`, the spawner test and fed per cell (they cannot change while tiles
  fall), which keeps long teleporter chains (the snake) cheap. Drops fall like tiles (diagonal slides too).
  After every pass that moved something, and again when a pass settles (gravity not calm), every drop on a
  drop point leaves, so a drop goes the moment it lands: an
  `{ k: 'exit', i, id, d, points, got }` step, its goal counts, `SCORE.exit` added flat (no chain factor),
  then gravity goes on and refills the cell. A spawner spawns a drop instead of a tile when one is due
  (`dropDue`: by `S.drops`, of a kind the spawner allows, the first drop goal that still needs more than
  the drops of its kind on the board); a spawned drop resets `wait`. `move` adds 1 to `wait` per spent move.
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
- **reshuffle**: seeded shuffle of movable tiles (drops stay put) until there is no match and a move exists;
  after 200 tries it also redraws plain colours (400 max).
- **score**: `SCORE = { exit: 200, tile: 10, crack: 20, unlock: 30, create: 50, fire: 50, zero: 100, chainCap: 5 }`.
  `pointsOf(step, chain)` sums a wave's cleared tiles, cracks, unlocks, created and fired specials
  (a fired zero-day at `zero`), times the chain factor: the wave's place in the cascade (1 for the
  move's first wave), capped at `chainCap`. Each wave step carries `points`; `S.score` is the total
  (a save without it loads as 0). The score never decides win or loss.
- **finale**: `finale(S)` (precondition `won(S)`) sets `S.spare` to the moves left and `S.moves` to 0,
  then returns `{ steps }` starting with a `{ k: 'finale' }` marker: every special on the board fires
  (a wave, then gravity and cascade, repeated until none is left, 500 rounds max), then the spare
  moves go in rounds of up to `FINALE_BATCH` (5): each round turns that many distinct seeded random
  plain, unlocked tiles (never drops) into bombs (1/3) or worms (h or v) with one `convert` step (`spent` = the
  moves it uses) and fires the board again. Its gravity is calm (no settle-time damping), so lucky
  lines are allowed; drops stay (no exits, none due once won). All of it scores; the result is fixed when the level is won.
- **saves**: `validSave` (version `v: 1`), `toSave`, `fromSave`; an invalid save is dropped.


## Levels (`src/levels.js`)

- Chapters of `CHAPTER` = 30 levels. `difficulty(level)` ramps over the chapter from a base
  (`min(.25, .05 * (chapter - 1))`) to .85, +.1 on every 5th level, -.1 on the level after
  (`breather`). Encrypted cells from `ENC_FROM` (4), firewalls from `FW_FROM` (7).
- `paramsFor(level, fails, drop)` gives `{ d, k, w, h, n, enc, hp, fw }`: colours 5, or 6 (d > .8), minus
  one from the 6th fail (min 4, so 4 only by retry easing); plain board a rectangle `w` x `h` (5 to `MAX_W`, `MAX_H`; `n` = max) (tall ones about the old square's area, 7..9 by difficulty and `hash(level, 1)`), shaped by `hash(level, 1, 7)`: 30 % square, 45 % tall,
  25 % wide (always 9 wide, 5 to 7 high, 45 to 63 cells; `hash(level, 1, 10)`), tall 1 or 2 off the side (`hash(level, 1, 8)`); encrypted cell count, hits and firewall count scale with `d`.
  `drop` lowers `d` (the bot's easing). Tune by playtest.
- `boardFor(level, fb, tags)` picks the board from `level` only (stream `rngFor(level, 31)`, so the
  older streams keep their draws): `{ kind: 'square', pattern }` or `{ kind: 'template', name, mirror }`.
  Square only before `SHAPES_FROM` (11, a breather, always a template); after it a template with
  chance .5 rising to .8 over the chapter, from those whose band holds `difficulty(level)`.
  Templates tagged `teleport` wait for `TP_FROM` (16, a breather, always a teleporter template), `drop` for `DROP_FROM` (21, a breather, always a drop template). Every 5th level
  prefers the tags `walled`, `split`, `funnel` (or the given `tags`). `fb` 1: a template of a lower
  band (smaller `dMin`), or the easiest one, among templates with the same drop-ness (a fallback never
  adds or removes a drop goal); `fb` 2: square. Variety: a template among the last
  `RECENT` (5) template boards is skipped while the pool has others, and a flippable template flips
  side on each use. This needs the earlier levels' own boards, so `boardFor` fills a module cache
  `picks` in level order (fb 0, default tags) and reads it.
  A pick that would still repeat one of the last two template boards (a thin pool at low difficulty) gives a
  square board instead (not on spikes, `TP_FROM` or `DROP_FROM`).
- `makeAttempt(level, fails, salt, drop, deal, fb)`: the board comes from `boardFor(level, fb)`; a
  template sets `n`, `w`, `h` (over `paramsFor`'s), `S.cell`, `S.spawn` and `S.tp` (when it has pairs). A plain
  rectangle gets `S.cell` with padding holes (right of `w`, below `h`); a plain square gets none. Plain patterns,
  pairs, firewall spots and the at most `w - 2` encrypted cells per row stay inside `w` x `h`. A template with
  drop points also sets `S.exit`, `S.drops = { every, wait }` (`every` from the template; `wait` starts at
  `every`, so the first drop comes with the first refill, or 0 when the template places starting drops,
  which replace the dealt tiles on their cells), and one drop goal per kind, first in `goals`: the kinds its
  kind-limited spawners and starting drops name, else one kind (two from d 0.7) chosen by level. Their
  `need` is `round(effort * (1 + 3 d) / kinds)`, 1 to 4 each. With two drop kinds there is no firewall goal,
  and a tile goal comes only when fewer than three goals stand (with chance .5, one colour), so a level keeps
  at most three goals. `S.board` is the template name,
  `square`, `tall` or `wide` for a plain board (`<shape>:<pattern>` with blockers). Blockers (encrypted cells, firewall
  spots) and goals depend on level, salt and drop; tiles on `deal`, not on fails, so a deal is
  the same board on every retry until easing drops a colour. Square blocker patterns (encrypted
  cells in mirrored pairs from row 2, at most w - 2 per row): `pairs` is the old random placement,
  `ring`, `wall` (a middle row), `cross` and `diagonal` (an X) fill the cells nearest the shape
  first, with jitter from the layout stream; firewalls are random from row 1. Square levels without
  blockers draw exactly as before. On a template blockers go only on zone cells that are not
  spawners, in a shuffled order, at most w - 2 encrypted per row and at most a third of the zone in all
  (a packed pocket stalls). The counts from `paramsFor` are scaled from its `w * h` board to the
  template's live cells and by the template's `effort`, which also scales the tile goals: boards with
  few cascades (wall, pocket, split) or few cells (notch) get less to do, tuned with the sim to the
  effort target `8 + 14 d`. A template level whose blockers number under `n` always gets a tile goal.
  In a small zone (under `2n` cells, a walled pocket) encrypted cells take one
  hit: few matches reach such a zone, and the bot only values a crack once it breaks. Goals use the
  fails-0 colour count for their size, and goal colours never include the colour that easing
  drops from the 6th fail. Goal kinds are decided first and blockers are placed only with their goal
  (no crack goal, no encrypted cells; no firewall goal, no firewalls); level `FW_FROM` always gets a
  firewall goal. Tile goals are `GOAL` (1.2) times the base size. Goal kinds: `crack` (all encrypted cells), `firewall`, `tiles` (one
  colour, or two at 60% each on harder levels). Tile goals show in `goalColours(level)` (`levels.js`): the colour
  slots in `S.types` are remapped (the deal is unchanged) so neighbouring levels never share a goal colour; odd
  levels draw two colours freely, even levels draw from what both odd neighbours leave.


## Templates (`src/layouts.js`)

- `TEMPLATES`: whole boards drawn as rows of space-separated tokens (`.` live, `o` hole, `#` block,
  `z` blocker zone, `S` spawner, `S0`..`S2` drop spawner, `iA`/`eA` teleporter pair, `X` drop point,
  `D0`..`D2` starting drop tile) with `name`, a difficulty band `dMin`..`dMax`, `tags`, `mirror`
  (not symmetric, may be flipped) and `effort` (factor on blocker counts and tile goals). Any `S` means only marked cells spawn, so such a template marks
  its top row too. Stage 1 has shapes (notch, pillars, diamond, hourglass, frame) and walled or split
  boards (split, wall, pocket). Teleporter templates mark their spawners explicitly: `crossing` (a
  block row with four pairs that cross left to right and back), `snake` (one spawner top left, each
  column's bottom ported to the next column's top, so tiles snake across the board; flippable) and
  `relay` (split by a block column; the second half has no spawner and is fed by four pairs from the
  bottom of the first; flippable). Drop templates (tag `drop`, with `X` drop points) carry `every`, their drop
  schedule: `chute` (an open board whose bottom row has blocks in the corners and only two drop points, so most drops need
  swaps sideways, every 3), `corner` (the corner run: the
  snake with a drop point bottom right, every 0; flippable), `funnel` (the mirrored funnel: a corner run on each
  side of a block column, kind 0 from the top left, kind 1 from the top right, both ending on drop points by the
  middle, every 3) and `sluice` (a block row with gaps above a bottom row of drop points, every 0). A drop
  resting on a bottom cell that is not a drop point moves only by a swap that makes a match (or a worm or bomb
  swap), so a drop template keeps several drop points within a few swaps of where drops land.
  Second library (from `docs/research/2026-11-16-board-designs.md`, 26 boards): shapes and walled boards
  heart, ziggurat, bucket, battlements, offset, bowtie (spawners part way down the sides), goblet, arch, slope,
  terrace, valley, mask, plus, butterfly, vase, gate, tee, safe; teleporter boards donut (a hole that tiles
  cross by teleporter) and delta; drop boards hopper, scree, locket, ledge, yoke (one drop kind per leg) and
  pachinko (block pegs). `effort` and bands are tuned with `tools/sim.mjs` over levels 1 to 150.
  Third library (from `docs/research/2026-11-16-board-shapes-second-pass.md`, 112 boards): non-square boards,
  70 tall (towers, letters, lanes, stacked rooms), 36 wide (bands, crowns, bridges) and a few 9 x 9 island boards;
  81 shapes and walled boards, 15 teleporter boards (top rows marked `S`), 16 drop boards. Tags `tall`, `wide`,
  `lanes`, `island` are descriptive only. Each was tuned by forcing it onto up to seven levels in its band
  (effort about effort x 90 / average ratio), then checked with `tools/sim.mjs 1-150`; 153 templates in all.
- `parse(t, mirror)` gives `{ n, w, h, cell, spawn, tp, exit, zone, drops }`: rows give `h`, tokens per row `w`
  (all rows equal, else it throws), `n = max(w, h)`; cells right of `w` and below `h` are holes in `cell`
  (padding, top left anchor); mirror flips within `w`. `cell` and `spawn` are left
  out when the template needs none (square, no holes). `S.w`, `S.h` are the visible rectangle, `S.n` the grid;
  missing in a save means square. `validSave` takes n 5..11 and w, h in 5..n with max(w, h) = n. `zone` is the `z` cells, or every live
  cell without a feature. A pair letter used twice on one side throws.
- `check(layout)` lists problems: a side outside `MIN_SIDE..MAX_W` / `MAX_H` (5..9 wide, 5..11 tall), a spawner on a dead cell, a teleporter pair that is
  incomplete, on a dead cell or shares a cell with another pair, an egress that also spawns (it must be
  fed by its ingress only), an egress in a gravity loop (walking `above` up from it comes back to it;
  filling an empty board does not show a loop), a live cell that an
  empty board never fills by `gravity` (straight, through teleporters, or diagonal), no legal move after `fillBoard`,
  and on a board with drop points a spawner or starting drop with no path to one (`exitDistance`). The dummy
  board has no `drops` schedule, so nothing spawns drops while it settles.
- `exitDistance(layout, swap = 1)`: cost from each cell to the nearest drop point (`Infinity`: none), cheapest
  paths back from the drop points: 1 per cell a drop falls (through teleporters), `swap` per swap with a
  live neighbour (any side).
  A test runs it over every template, both mirrors.


## Bot (`src/bot.js`)

- Constants: `CAP` 80 (moves before giving up), `K` 1.3, `C` 2 (the human factor), `RUNS` 3,
  `SALTS` 10 (per drop on a square), `TEMPLATE_SALTS` 3 (per drop on a template), `MIN_LIMIT` 10. The salt search stops a salt at its first capped run (same results).
- `pick(S, rnd)` (exported): one-move lookahead. Every legal move in both directions is played
  on a copy whose seed is `hash(991, S.level, S.spawns, S.moves)`, independent of the real
  refill seed, so the bot cannot see future refills. Value: goal progress first (1000 per
  goal), +15 per special on the board, +.5 per tile spawned, plus a tiny random tie-break. A drop on the
  board counts towards its goal by `1 - dist / (far + 1)`, `dist` its `exitDistance` with a swap costing
  `n` (falls first: a swap needs a match, and along a snake the flow is the way), `far` the board's
  farthest finite cost; computed once per board (keyed by the shared `S.exit`). So a step closer outweighs a
  plain clear, a drop that leaves is worth a whole one, and a new drop never lowers the value.
- `solve(S, seed, nice)` plays a copy to a win with no limit (`Infinity` at `CAP`). Copies share the static
  board arrays (`cell`, `spawn`, `tp`, `exit`) and copy `drops`.
- `limitFor(need, fails)` = `max(MIN_LIMIT, ceil(need * K + C))`, then +10% per fail from the
  4th, capped at +40%.
- `search(level, run)` (exported, `run` defaults to `solve`): on the level's own board (`fb` 0) tries salts on deal 0,
  then lowers difficulty by `drop` steps of 0.1 (to 0.5 on a template, 1 on a square), until all `RUNS` bot runs
  finish (layout and goals). A template that never does falls back to a lower-band template (`fb` 1), then a square
  (`fb` 2).
- `prepare(level, fails, pick)`: the first call for a level runs `search`. Then the bot plays `DEALS` (12) seeded tile boards
  (deals) of that layout once each; the easiest and the hardest are dropped, the median sets `need` for every attempt
  of the level, and up to `KEEP` (10) deals are kept. `{salt, drop, fb, need, deals}` is memoised (last 8 levels). An
  attempt plays `deals[pick % deals.length]` on board `fb` with `limitFor(need, fails)`, so the move count only changes by the fail
  easing. The bot plays with `nice` off.


## Worker and UI (`src/worker.js`, `src/ui.js`)

- Boards: each attempt plays one of a level's 10 deals by `pick` (stored in `S.pick`). A level's first attempt
  picks at random (`crypto`), every retry or restart takes the next (mod 10), so a board repeats only after 10
  attempts. The next level's pick is fixed when it is prefetched.
- Worker protocol: the UI posts `{ level, fails, pick }`, the worker answers `{ level, fails, pick, S }`
  from `prepare`, in order. `worker.onerror`/`onmessageerror` show a
  non-dismissable "Reload" sheet. The UI keeps `ready` (answers by `level:fails:pick`), `ask` (once per
  key), `want` (a promise for the latest key only, delivering a copy) and `prefetch(level,
  fails, pick)`, which asks for the next level and the next retry after every start.
- `brief(level, fails, pick)` (`pick` only from a reload): the level start screen, on every start path (next level `brief(level + 1, 0)`, try
  again `brief(S.level, S.fails + 1)`, Restart level (menu, asks first) `brief(S.level, S.fails)`, not a fail;
  Start over, the level picker, `?level=N`, and boot when no attempt is saved). Boot with a saved attempt resumes
  play without it. It picks the board, closes sheets, saves only `{ level, fails, pick }` to `override-v1` (a reload
  shows the screen again, with the same deal) and opens the sheet (class `brief`: opaque backdrop, the board is not seen) with the
  chapter and level, a preparing line and a disabled Start. When `want` answers (at once if prefetched; after
  20 s the Reload sheet instead) it shows the goals (`icon(goal, types)`, full counts), the move limit and
  DECKER's `commsLine({ level })`, and enables Start. Start sets `S`, opens the play log attempt
  (`logStart(true)`), sets `run.best` and `run.fails`, saves, then `start()`. The empty room under the text is
  for later briefing and items.
- View model: `sprites` (by tile id, with target `tx`, `ty`), `vEnc`, `fx`. `sync()` rebuilds
  the view from `S`; it runs at level start and after every move's animation, so the view
  always equals the state. `animate(steps)` plays the `move` steps in order (swap and back,
  combo flash, convert, wave with flashes, cracks, unlocks, pops and created specials (blasts: worm beams
  shoot out both ways, bombs flash and send two shock rings, sparks fly from every fired special and cleared
  tile, the board shakes; `BOOM.spark`/`BOOM.shake` scale it), fall (a run of
  gravity passes plays as one drop: tiles accelerate, `GRAV`, and hop once on landing, `HOP`; new
  tiles start stacked above their spawner and are clipped to below its top edge, `top`, cleared on landing
  and on a shuffle; a move through a teleporter goes into the sprite's `hops`: the tile sinks out through
  the ingress's bottom edge (clipped there), then drops in above the egress, clipped to below its top edge), exit (the
  drop tile leaves the view at once; an `exit` effect slides it out through the cell's bottom edge, clipped to the
  cell, with a light bar flaring on the edge and sparks; the HUD adds its `points`; 220 ms per exit), shuffle with a toast). `animate(steps, speed)`: `speed` divides every
  wait and speeds tile motion (`pace`). `play(a, b)` calls `move`, logs the move (before the finale), runs
  `finale(S)` at once if the move won, saves (closing mid-cascade or mid-finale loses nothing), animates the
  move, then `playFinale`, syncs, then shows the win or loss sheet. A won save without `spare` (from before
  the finale) runs `finale` silently at boot.
- Finale: `playFinale(steps)` plays the steps sped up so the whole finale takes
  at most about `FINALE_MS` (10 s; `finaleMs` estimates the normal length from `STEP_MS`). A tap anywhere
  (document capture `pointerdown`, ignores the grace, stops the event) skips: the animation stops at the next
  step and `sync()` shows the saved end state. Reduced motion skips the animation.
- HUD score: `#score` under the goals shows `score n`, plus `· best n` when the level has a best
  (plain digits, no grouping). While a move animates, `shown` holds the HUD's score,
  moves and goal progress: it starts at the score and goal counts before the move and the moves left after it, each
  wave and exit step adds its `points` and takes its `got` (the goal counts after that step, recorded by `core.js`), and each finale `convert` step spends its `spent` spare moves, so the count ends at `S.score` and 0; in the finale a drop waits at most 150 ms, so the next round
  converts and fires while tiles still fall (state is unchanged, only the look overlaps);
  the round's specials light up 50 ms apart and blast 60 ms apart, each cleared tile popping with its
  nearest special;
  `sync()` then clears it.
- Best scores: `override-best` is `{ "<level>": score }`, read once at boot (junk becomes `{}`);
  `bestOf(level)` is an integer or `null`. `win()` reads the previous best, then stores the higher one.
- Win rows: below the win text, a grid of `score` (large, glowing, counting up from 0 over 1.2 s, eased),
  `best` (the previous best; omitted on a first win) with dotted leaders, then `>> NEW BEST <<` (amber,
  blinking with `alertflash`) when beaten. A tap on the sheet ends the count-up. Reduced motion shows the
  final number at once and no blink.
- Input: pointer down then drag past a third of a cell swaps with that neighbour; tap a tile,
  then an adjacent tile, also swaps. Tapping a selected worm or bomb again fires it (`move(S, i, i)`). Dead cells take no input (`cellAt` returns -1, a drag onto one
  does nothing); worm sparks skip them. Only the `S.w` x `S.h` rectangle is drawn and touched: `fit()` sets `cs = floor(min(wrap width / w, wrap height / h))` and a canvas of `w * cs` by `h * cs` (centred by `#wrap`), the draw loop skips padding cells, `cellAt` and drag targets stop at the rectangle, and worm sparks, beams and the clear-all flash span `w` or `h`. Old saves get `S.w`, `S.h` = `S.n` on load. Gates: `busy`, a 400 ms `grace` after a sheet closes or a
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
  `override-plays`, opt-in, `src/plays.js`; an attempt records the board name and its goals, with `t` for a tile
  goal and `d` for a drop goal) and Info (how to play, Share, GitHub, licence, font).
- Look: dark only, a hacker terminal. The strip (a thin band, `clamp(60px,10dvh,84px)`) shows the obstacle plate (locked; `unlockScene`
  toggles `#strip.open` for the open plate on a win). The canvas draws tiles as glowing
  characters (`GLYPHS` ロ ハ メ ト Ξ ミ ム, one per slot) so colour is never the only cue; specials are `drawWorm`
  (data packet along its line), `drawBomb` (chip with lit pins), `drawZero` (turning ring in the
  level's colours); blockers are `drawEnc` (static slab, amber outline for hits left) and
  `drawFw` (flames and cage bars). Dead cells: a hole is `drawHole` (faint back-slash hatching, no cell background, running on across neighbouring holes), so the board's
  edge follows the shape; a block is `drawBlock` (a dark riveted steel plate with faint hatching, no
  glow). `spawnMark` draws a small down chevron on the top edge of a spawner only where spawners differ
  from the plain top row (`S.spawn` entries below row 0 or limited to a drop kind). `tpMark` draws a
  teleporter end as a small port bracket with the pair's letter (A, B, ... by pair order), open to the
  bottom edge on the ingress and to the top edge on the egress, in the pair's colour (`TP_COL`), under the tiles.
  `exitMark` draws a drop point as an amber slot along the cell's bottom edge with two chevrons pointing out of
  the board (no template puts a drop point on a teleporter ingress, which would share that edge). Drop tiles are
  `drawDrop(d)`: solid, unlit hardware objects with a dark drop shadow, no glyph and no glow, so they read as
  nothing you can pop, and each kind has its own silhouette (colour is never the cue): 0 a keycard (a wide card
  with a chip and a cut corner), 1 a drive (an upright stick, plug pointing down, a blinking light), 2 a disk (a
  square cartridge with a cut corner, a metal shutter and a label). `drawTile` checks `isDrop` first (a drop has
  `t` -1 like a zero-day). HUD goals: one icon and count per goal (`icon(goal)`: a drop goal shows its piece, so
  there is one counter per drop kind). The comms line (`commsLine(S)` in `ui.js`, shown on the level start screen, not the play screen) explains encrypted cells at `ENC_FROM`, firewalls at
  `FW_FROM` and drops at `DROP_FROM`. Effects: worm streak, bomb shockwave, area flash, crack.
  Sheets (the level start screen too), menu and toast are terminal windows; the win sheet has the `PADLOCK`
  and `PWNED` art (`animateArt`, decoration, not translated). `prefers-reduced-motion` skips idle
  animation, effects and cycling (win art static). Tile colours come from `paletteFor`.
- Saving: `override-v1` holds `S` whole, written after every move. `override-run` is
  `{ best, fails }`. `override-best` holds the best score per level. A save that fails `validSave` but holds an integer `level` restarts that
  level fresh (keeping a valid `fails`). `?level=N` works off GitHub Pages only (`DEV`).
- Text is `t(key, {placeholders})` over `lang/en.json`; never put visible text in code.
