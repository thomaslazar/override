# Override: agent notes

Override is an ad-free match-3 for phones (vanilla HTML, CSS and ES modules, no build step,
no dependencies), installable as a PWA and deployed to GitHub Pages. Third sibling of Kiln
and Splice. Set in Splice's city: you are a crew's on-site hacker, each level an obstacle on
a run, hacked on your field deck.

Read before changing behaviour:
- `docs/superpowers/specs/2026-11-11-core-loop-design.md`: rules, levels, fairness, architecture.
  Where this file and the spec disagree, the spec wins.
- `docs/HANDOVER.md`: setting, role, fairness rules, later ideas.
- `CONTRIBUTING.md`: code, copy and commit conventions. Follow them.

## Commands

- Run: `python3 -m http.server 8081` and open http://localhost:8081/ (`file://` does not work;
  avoid ports 8000 and 8080, the siblings' service workers control them). `?level=N` starts
  level N fresh. Off GitHub Pages the service worker is unregistered and `override-` caches
  are deleted, so a reload shows the files on disk.
- Test: `node --test` (not `node --test tests/`).
- Balance: `node tools/sim.mjs [levels] [runs] [--refill nice]`, e.g. `node tools/sim.mjs 1-30`.
  Levels are `1-60`, `3,25,50` or a mix (default 1, 3, 5, 10 ... 60). Run `r` plays with
  `fails = r`. Per level it prints board, goals, need, limit, margin, salt, drop and time.
  `--refill nice` also re-solves with the helpful refill on and prints what it saves.
- Browser checks: headless Chromium with `--virtual-time-budget` stalls the worker; use real time.

## Files

- `index.html`: markup (comms line, scene with the lock, deck with HUD, board canvas, sheet, menu, loading card). `style.css`: all styles, light and dark.
- `src/core.js`: rules, pure (no DOM, no storage). Tested in `tests/core.test.mjs` and `tests/refill.test.mjs`.
- `src/levels.js`: chapters, difficulty, `paramsFor`, `makeAttempt`, pure. Tested in `tests/levels.test.mjs`.
- `src/bot.js`: greedy bot over the core API, pure; sets each attempt's move limit. Tested in
  `tests/bot.test.mjs`. `tools/sim.mjs`: balance report with it.
- `src/worker.js`: Web Worker that runs `prepare(level, fails)` off the main thread.
- `src/ui.js`: language, worker client, view model, step animation, drawing (canvas), input, sheets, menu, saving.
- `lang/`: all visible text. `languages.json` maps codes to own-language names (only `en` now);
  `<code>.json` holds flat `"key": "text"` pairs with `{placeholders}`. `tests/lang.test.mjs` checks them.
  `tests/helpers.mjs` has shared test builders.
- `fonts/`: Barlow Semi Condensed (latin 400 and 600, woff2), self-hosted, with `OFL.txt`.
- `manifest.webmanifest`, `sw.js`, `icons/`: PWA. `sw.js` is network first (revalidates; 3 s
  bounds the wait for response headers only, cache is the offline or slow fallback). `CACHE` is `override-2`; rename it when `sw.js`
  changes how it caches or `SHELL` changes, so `activate` drops the old cache (only `override-`
  caches). `icons/og.png` (1200 x 630) is the link preview card; not in `SHELL`.
- `.github/workflows/pages.yml`: runs `node --test` on pull requests and pushes; on push to
  `master` it deploys to https://thomaslazar.github.io/override/. New site files must be added
  to its copy step and, if needed offline, to `SHELL` in `sw.js`. `.github/pull_request_template.md`: PR checklist.
- `README.md`, `ROADMAP.md`, `CONTRIBUTING.md`, `LICENSE.md` (PolyForm Noncommercial 1.0.0).
- `spike/`: the throwaway prototype. Not part of the game.
- `docs/`: `HANDOVER.md`; `superpowers/` holds the spec and plan.

## Core (`src/core.js`)

Sections are marked `/* ---------- name ---------- */`. `S` is a plain, JSON-safe attempt (shape in
the spec): `n` board side (7..9), `k` colours, `types` glyph slot per colour, `grid` (tile or
null, index `r * n + c`), `enc` (encrypted hits left per cell), `goals`, `moves`, `limit`,
`need`, `seed`, counters `spawns`, `shuffles`, `ids`, and `nice` (helpful refill on for the
player, off for the bot). A tile is `{ id, t, s, lock }`; `s` is `null`, `'h'`/`'v'` (worm),
`'b'` (logic bomb) or `'z'` (zero-day, `t === -1`); `lock` is a firewall.

- **random**: `mulberry32`, `hash`, `rngFor`. No `Math.random` anywhere in `src/`.
- **matching**: `findGroups` merges horizontal and vertical runs of 3+ that share a cell into
  one group; encrypted cells, empty cells and zero-days never match. `specialOf(group, swipe)`:
  5+ run makes a zero-day, an L or T (a horizontal and a vertical run) a bomb, a run of 4 a
  worm along the swipe (or its own direction). `spotOf` puts it on a swapped cell, else the
  crossing (bomb), else the middle of the longest run. `swapLegal` needs a match, or a special.
- **move**: `move(S, a, b)` returns `{ ok, steps }`. Steps are `swap`, `back`, `combo`,
  `convert`, `wave`, `fall`, `shuffle` (contract in the plan). Flow: swap; a swap with a
  special is a `combo` then cascade; a plain match spends the move and cascades; no match swaps
  back and costs nothing. After a cascade, if goals are not met and moves remain but no move
  exists, `reshuffle` runs.
- **combos**: `ww` row and column, `bw` three rows and three columns, `bb` 5x5, `zw`/`zb`
  zero-day with a worm or bomb converts every tile of that colour into worms (random h or v) or
  bombs, then fires them, `zz` clears the board. Zero-day with a plain tile clears that colour.
  A lone zero-day fired by a cascade clears the most common colour.
- **wave**: fires specials in a chain (each id once), cracks encrypted cells (hits from a fired
  area, plus matched neighbours), unlocks firewalled tiles (a firewalled tile hit is unlocked,
  not cleared), clears the rest and counts goals, then places the new specials. A special
  created on a cell whose firewalled tile was only unlocked consumes that tile: it appears in
  the wave's `cleared` and counts for the tiles goal.
- **gravity**: passes until stable: straight down, spawn in row 0 with `spawnColour`, diagonal
  fill for cells not fed from above (a cell under an encrypted cell or firewalled tile).
  Roofed pockets stay empty. Encrypted cells and firewalled tiles never move.
- **refill** (here, not in `levels.js`, to avoid an import cycle): `REFILL = { A: 1.5, B: 0.5, M: 2 }`.
  `pressure(S)` is 0 when goal progress keeps pace with moves used, up to 1 when far behind (0
  without a limit). `setsUp(S, i, t)` is true when colour t at i makes a near pair without a
  direct match (no free cascades). `refillWeights` start at 1; with `nice`, +`A` + `M * pressure`
  for a colour that sets up a pair, +`B` for a colour a tiles goal still needs. Weights only
  ever add, never take away. `spawnColour` draws from `rngFor(S.seed, 7, S.spawns++)`.
- **reshuffle**: seeded shuffle of movable tiles until there is no match and a move exists;
  after 200 tries it also redraws plain colours (400 max).
- **saves**: `validSave` (version `v: 1`), `toSave`, `fromSave`; an invalid save is dropped.

## Levels (`src/levels.js`)

- Chapters of `CHAPTER` = 30 levels. `difficulty(level)` ramps over the chapter from a base
  (`min(.25, .05 * (chapter - 1))`) to .85, +.1 on every 5th level, -.1 on the level after
  (`breather`). Encrypted cells from `ENC_FROM` (4), firewalls from `FW_FROM` (7).
- `paramsFor(level, fails, drop)` gives `{ d, k, n, enc, hp, fw }`: colours 4 (levels 1-3,
  easy, breathers), 5, or 6 (d > .8), minus one from the 6th fail (min 4); board 7..9 by
  difficulty and `hash(level, 1)`; encrypted cell count, hits and firewall count scale with `d`.
  `drop` lowers `d` (the bot's easing). Tune by playtest.
- `makeAttempt(level, fails, salt, drop)`: layout (encrypted cells in mirrored pairs from row
  2, firewall spots, goals) depends on level, salt and drop; tiles also on fails. Goals use the
  fails-0 colour count for their size, and goal colours never include the colour that easing
  drops from the 6th fail. Goal kinds: `crack` (all encrypted cells), `firewall`, `tiles` (one
  colour, or two at 60% each on harder levels).

## Bot (`src/bot.js`)

- Constants: `CAP` 80 (moves before giving up), `K` 1.3, `C` 2 (the human factor), `RUNS` 3,
  `SALTS` 10, `MIN_LIMIT` 10.
- `pick(S, rnd)` (exported): one-move lookahead. Every legal move in both directions is played
  on a copy whose seed is `hash(991, S.level, S.spawns, S.moves)`, independent of the real
  refill seed, so the bot cannot see future refills. Value: goal progress first (1000 per
  goal), +15 per special on the board, +.5 per tile spawned, plus a tiny random tie-break.
- `solve(S, seed, nice)` plays a copy to a win with no limit (`Infinity` at `CAP`).
- `limitFor(need, fails)` = `max(MIN_LIMIT, ceil(need * K + C))`, then +10% per fail from the
  4th, capped at +40%.
- `prepare(level, fails)`: at fails 0 tries salts 0..9, then lowers difficulty by `drop` steps of
  0.1, until all `RUNS` bot runs finish; `need` is the median, and `{salt, drop, need}` is
  memoised (last 8 levels). Retries reuse that salt and drop (same layout and goals, no search);
  their need is at least the fails-0 need (exactly it if the bot cannot finish), so a retry never
  gets fewer moves than the first try. The bot plays with `nice` off.

## Worker and UI (`src/worker.js`, `src/ui.js`)

- Worker protocol: the UI posts `{ level, fails }`, the worker answers `{ level, fails, S }`
  from `prepare`, in order. `worker.onerror`/`onmessageerror` hide the loading card and show a
  non-dismissable "Reload" sheet. The UI keeps `ready` (answers by `level:fails`), `ask` (once per
  key), `want` (a promise for the latest key only, delivering a copy) and `prefetch(level,
  fails)`, which asks for the next level and the next retry after every start.
- `begin(level, fails)`: closes sheets, shows the loading card if the answer is not ready
  (at least 400 ms), sets `S`, `run.best` and `run.fails`, saves, then `start()`. Next level is
  `begin(level + 1, 0)`; Try again is `begin(S.level, S.fails + 1)`; Restart level (menu, asks
  first) is `begin(S.level, S.fails)`, not a fail.
- View model: `sprites` (by tile id, with target `tx`, `ty`), `vEnc`, `fx`. `sync()` rebuilds
  the view from `S`; it runs at level start and after every move's animation, so the view
  always equals the state. `animate(steps)` plays the `move` steps in order (swap and back,
  combo flash, convert, wave with flashes, cracks, unlocks, pops and created specials, fall with
  spawns from above, shuffle with a toast). `play(a, b)` calls `move`, saves right after it and
  before animating (closing mid-cascade loses nothing), animates, syncs, then shows the win or
  loss sheet.
- Input: pointer down then drag past a third of a cell swaps with that neighbour; tap a tile,
  then an adjacent tile, also swaps. Gates: `busy`, a 400 ms `grace` after a sheet closes or a
  level starts, any open sheet or menu (`blocked()`), a won or lost state.
- Sheets: one sheet for win ("Door’s open" with a note at a new chapter), loss (Try again) and
  the confirmations. The menu has tabs Run (best level, Restart level, Start over), Settings
  (language, theme auto/light/dark) and Info (how to play, Share, GitHub, licence, font).
- Look: the canvas draws tiles as seven glyphs (`types`) so colour is never the only cue;
  specials have their own shapes in their colour with the colour's glyph cut out (worm a
  data packet along its line, bomb a chip with pins, zero-day a turning ring in the level's colours); firewall and
  encrypted cells have their own drawing. `prefers-reduced-motion` skips rain, fades and eases.
- Saving: `override-v1` holds `S` whole, written after every move. `override-run` is
  `{ best, fails }`. A save that fails `validSave` but holds an integer `level` restarts that
  level fresh (keeping a valid `fails`). `?level=N` works off GitHub Pages only (`DEV`).
- Text is `t(key, {placeholders})` over `lang/en.json`; never put visible text in code.

## Working rules

- Every `localStorage` key and cache name starts with `override-` (now `override-v1`,
  `override-run`, `override-lang`, `override-theme`, `override-2`); the origin is shared with
  Kiln and Splice, and `sw.js` only deletes `override-` caches.
- Conventional Commits. Ask before committing unless the owner has said otherwise for the
  current work.
- **No attribution of any kind.** Never add `Co-Authored-By:` trailers or "Generated with"
  lines (Claude, Claude Code or any other tool) to commits, PR bodies, issues or docs.
- No em-dashes in UI copy or docs. Use typographic apostrophes (’) in visible text.
- Rerun `node --test` and the sim after rule or balance changes.
- New site files go into the workflow's copy step and, if needed offline, into `SHELL`.
