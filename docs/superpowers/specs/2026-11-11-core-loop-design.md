# Override core loop: design

Date: 2026-11-11. Status: draft for review. The look is a placeholder; a visual pass follows.

## Intent

Override is an ad-free, fair match-3 game for phones, the third sibling of Kiln and Splice
(see `docs/HANDOVER.md`). You are a crew's on-site hacker; each level is an obstacle on a run,
hacked on your field deck. The first build is the core loop and the repository around it:
generated levels with goals, blockers, specials and a move limit, verified by a bot, saved
locally, installable as a PWA and deployed to GitHub Pages. It should already feel good to play.

A throwaway prototype (`spike/index.html`, not committed) was played on the owner's phone.
Verdict: "works well enough"; the look is still up for debate. This document records what the
spike settled and the decisions made after it. Where a number is a guess, it says so.

## Goals

1. Classic match-3 with the genre's full special and combo set, as settled in the spike.
2. Endless seeded levels in chapters of 30, with difficulty driven by board size, colour count,
   blockers and goals.
3. Every level verified beatable by a bot, which also sets the move limit.
4. Fair play: refills only ever lean the player's way, the board never dies, repeated fails ease
   the level.
5. The repository set up like the siblings: docs, tests, balance tool, PWA, Pages deploy, link
   preview card.

## Non-goals (this build)

Runs, crew beyond the decker's comms line, gear, shop and currency, music and sound, the
"bring items down" goal, the trace blocker, board shapes with holes, score and stars, the final
look, translations beyond English, an "easier retries" switch.

## Anti-goals

- A loss caused by refill luck or a dead board.
- Refills that work against the player in any situation.
- Free cascades handed out so often that moves stop mattering.
- A UI that blocks while a level is generated.

## Rules

### Board and tiles

- Square board, 7, 8 or 9 cells per side, fixed per level.
- 4 to 6 tile types per level ("colours"). Each type has its own colour and a distinct glyph
  (circle, square, triangle, diamond, plus, hexagon, star), so play works without colour vision.
  A level uses the first `colours` types of a seeded order.
- A cell holds a tile, is an encrypted cell (no tile), or is empty (a pocket, see Gravity).

### Moves

- Swap two neighbouring tiles (up, down, left, right) by dragging one onto the other, or by
  tapping one, then a neighbour. Tapping the selected tile again deselects it.
- A swap that makes no match and involves no special is undone and costs nothing.
- Any swap that makes a match or involves a special costs one move.
- Firewalled tiles cannot be swapped.

### Matching

- Three or more of one colour in a row or column clear. Runs that share cells form one group.
- Worms and logic bombs keep their colour and match like normal tiles. Zero-days have no colour
  and never match.
- A group creates a special (one per group):

| Group | Special | Effect when fired |
| --- | --- | --- |
| 5 or more in a line | Zero-day (colourless) | Clears every tile of one colour |
| Horizontal and vertical runs (L, T, +) | Logic bomb | Clears the 3x3 area around it |
| 4 in a line | Worm | Clears its row (`h`) or column (`v`) |

- Placement: on the swapped cell that is part of the group, else at the crossing (bomb), else in
  the middle of the longest run.
- Worm direction: made by a swap, it follows the swipe (a sideways swap makes a row worm, an up
  or down swap a column worm). Made in a cascade, it follows the line of four (horizontal line,
  row worm). Settled by playtest: the owner expects the swipe rule.

### Firing specials

- A special fires when it is cleared (by a match or by another special's blast), and on any
  swap: a swapped special fires on the cell where it lands; the other tile just moves.
- Zero-day swapped with a normal tile: clears every tile of that tile's colour. Fired by a
  blast: clears the most common colour on the board.
- Chains: every special hit by a blast fires once.

| Combo (swap two specials) | Effect, centred on the cell the dragged tile landed on |
| --- | --- |
| Worm + worm | Row and column (cross) |
| Worm + logic bomb | Three rows and three columns |
| Logic bomb + logic bomb | 5x5 area |
| Zero-day + worm or bomb | Every tile of the special's colour becomes that special (worms get a seeded direction) and all fire; specials already of that colour fire too |
| Zero-day + zero-day | Whole board |

### Blockers

- **Encrypted cell:** occupies a cell, holds no tile, does not fall. Has 1 to 3 hits. Loses one
  hit per wave when a matched cell is next to it (4-neighbourhood) or a blast covers it, at most
  one hit per wave. At 0 it becomes an empty cell and tiles fall in.
- **Firewall:** a lock on a tile. The tile cannot be swapped and does not fall. A match through
  the tile or a blast covering it removes the lock; the tile stays.

### Gravity and refill

- After each wave, tiles fall straight down. A cell with no straight feed (an encrypted cell or
  a firewalled tile somewhere above it) fills diagonally from the upper left or right, preferring
  tiles that cannot fall straight themselves. A cell roofed over so that nothing can reach it
  stays empty (a pocket) until the blocker above breaks. Spike: 900 random moves, no other
  empty cells.
- New tiles enter at the top. Their colours come from the refill (see Fairness).
- Waves repeat until no match is left (cascades).

### Reshuffle

When the board has no valid move after a move resolves, the movable tiles are shuffled (seeded)
until there is no match on the board and at least one valid move. Free, no move spent. After
200 tries, colours of normal tiles are redrawn too. A special next to a movable tile counts as a
valid move, so boards with specials never reshuffle.

### Goals, win and loss

- Goal kinds: `tiles` (clear N tiles of a colour, specials of that colour count), `crack`
  (every encrypted cell), `firewall` (every firewall). A level has 1 to 3 goals.
- Win: every goal met once the move has fully resolved. Leftover moves play a short flourish
  (my call: each fires as a seeded worm, purely visual, nothing is counted); no score.
- Loss: no moves left and a goal still open.
- Move limit fiction: "Patrol in n", the time until the patrol comes back.

## Levels

All in `src/levels.js`, pure and seeded: a level is reproducible from its number, its fail
count and a salt.

### Chapters and difficulty

- A chapter is 30 levels: `chapterOf(level)` gives `{n, start, pos}` (`pos` 1..30).
- `difficulty(level)` in 0..1: a ramp over the chapter from the chapter's base to its peak,
  plus a 5-level wave (every 5th level a small peak, the next level a breather). Chapter 1's
  base is 0; each later chapter starts a little higher, capped (my call: `+0.05` per chapter, at
  most `0.25`). The handover's later run structure (levels 1 to 20 in small runs, 21 to 30 the
  big run) fits on top without changing this.

### What difficulty drives

Exact mappings are my call, tuned with the sim and by playtest:

- Colours: 4 below about `d = 0.25` and on breather levels, 6 only above about `d = 0.8`, else 5.
- Board size: seeded, 8 most often; 9 leans to easier levels, 7 to harder ones.
- Encrypted cells: count and hits grow with `d`; placed in mirrored patterns, at most `N - 2`
  per row so a row is never sealed.
- Firewalls: count grows with `d`.
- Goal sizes: grow with `d`.
- Introduction: levels 1 to 3 have `tiles` goals only; encrypted cells first appear on level 4,
  firewalls on level 7. The first level with each shows a one-line hint in the comms line.

### Move limit from the bot

- `src/bot.js` holds a greedy bot over the core API: it tries every valid swap, scores the
  resolved result (goal progress first, then specials made, then cleared tiles) and plays the
  best, with seeded tie breaks.
- For an attempt, the bot plays three copies with different refill seeds and no limit, up to a
  cap (my call: 80 moves). `need` is the middle result.
- The limit is `ceil(need * K + C)` (my call to start: `K = 1.3`, `C = 2`; tune by playtest).
- If any of the three runs hits the cap, the level is regenerated with the next salt (at most 10
  times, then difficulty drops by 0.1 and it tries again).
- The bot plays with the neutral refill (see Fairness), so its limit is close to the honest
  worst case and the player always gets at least that much help on top.

### Retries and fail easing

- Layout and goals depend on the level only and stay the same on retry; the starting tiles are
  reseeded from the fail count.
- From the 4th fail, each retry adds 10% of the original limit, capped at +40%.
- From the 6th fail, the level uses one colour fewer, down to 4.
- Restarting a level from the menu is not a fail.

## Fairness: helpful refill

Each new tile's colour is drawn from the same seeded stream, by weight:

`w(colour) = 1 + A * setsUp + B * goalColour + M * pressure * setsUp`

- `setsUp` (0 or 1): the colour at that cell would make a pair that is one swap from a match.
  Direct matches get no bias: free cascades take away the player's agency.
- `goalColour` (0 or 1): a `tiles` goal still needs this colour.
- `pressure` in 0..1: 0 while goal progress keeps pace with moves used; grows as progress lags
  the share of moves used.
- Starting weights (my call): `A = 1.5`, `B = 0.5`, `M` up to `2`.
- Weights never go below 1 for any colour: help only ever adds, nothing is ever weighted against
  the player.
- The bot uses the neutral refill (`A = B = M = 0`). `tools/sim.mjs --refill nice` plays the bot
  with the player's refill and reports how many moves the help is worth, to tune `K` and the
  weights and to catch help that flattens skill.
- The game says it plainly (Info): "Refills lean your way when you’re behind. Never against you."

## Architecture

Vanilla HTML, CSS and ES modules, no build step, no dependencies, as the siblings.

### Core

- `src/core.js`: pure rules, no DOM, no storage. Sections marked `/* ---------- name ---------- */`.
  - random: `mulberry32`, `hash`. No `Math.random` anywhere in `src/`.
  - `move(S, p, q)` resolves a whole move synchronously and returns the steps for the UI:
    `swap`, `back` (undone swap), `fire`, `clear`, `crack`, `unlock`, `create`, `fall`, `spawn`,
    `reshuffle`, each with the cells it touches. The UI only animates the steps. The bot and the
    tests use the same function.
  - `validMoves(S)`, `hasMove(S)`, `findGroups`, `won(S)`, `lost(S)`.
  - Saves: `toSave`, `fromSave`, `validSave` (version `v: 1`).
- `src/levels.js`: `chapterOf`, `difficulty`, `paramsFor(level, fails)`, `makeLayout(level,
  salt)`, `startState(level, fails)`, `refillWeights`.
- `src/bot.js`: `solve(S, seed)`, `needFor(S)`, `limitFor(need, fails)`.

### Worker

- `src/worker.js` is a module worker (`new Worker(url, {type: 'module'})`). It imports
  `levels.js` and `bot.js` and answers `{level, fails}` with a finished start state (layout,
  goals, limit).
- It works ahead: while a level is played, it builds the next level and the next retry of the
  current one, cached by `(level, fails)`.
- If a start state is not ready, a loading card shows ("Level n", at least 400 ms) and the UI
  stays responsive.
- Tests and `tools/sim.mjs` import the modules directly, without the worker.

### UI

- `src/ui.js`: language, theme, rendering (canvas board, DOM HUD and sheets), input, step
  animation, saving.
- Layout as in the spike, a placeholder for the visual pass: decker's comms line, the scene (the
  device you are jacked into, your cable, rain and sodium light), and the field deck with the
  board. All colours are CSS tokens, light and dark, following the system with a theme setting.
  `prefers-reduced-motion`: no tweening, results show at once, no rain.
- HUD on the deck: "Chapter n · Level n", goals with glyph icons and counts left, "Patrol in n"
  (amber at 25% of the limit or fewer, red at 3 or fewer).
- Input waits while a move animates; touches are ignored for 400 ms after a sheet closes or a
  level starts.
- Sheets: win ("Door’s open", Next level), loss ("Patrol’s back", Try again), and the menu with
  tabs Run (Restart level and Start over, each asks first), Settings (language picker, theme) and
  Info (how to play, the refill line, Share, GitHub link, licence, font credit).
- Share: `navigator.share`, else copy the link with a "Link copied" note, else show the URL.
- No zoom, portrait only, a "Turn your phone upright to play." card in landscape on phones, as
  in the siblings.
- Comms: one seeded line per level from a small pool in `lang/`; the decker is "Decker" for now.
- Local playtest: `?level=N` starts level N fresh. Off GitHub Pages the service worker is
  unregistered and `override-` caches are deleted, so a reload shows the files on disk.

### Saving

Every `localStorage` key and cache name starts with `override-` (the origin is shared with Kiln
and Splice).

- `override-v1`: the whole state, saved right after every `move`, so closing mid-animation loses
  nothing.
- `override-run`: `{best, fails}` (best level reached, fails on the current level).
- `override-lang`, `override-theme`.
- A save that fails `validSave` but holds an integer `level` starts that level fresh; anything
  else starts level 1.

### Language

- `lang/languages.json` maps codes to own-language names; it lists only `en` for now.
- `lang/en.json`: flat `"key": "text"` pairs with `{placeholders}`. Never visible text in code.
- The language picker stays in Settings, as in Splice, ready for more languages.

### Font

Self-hosted from the start: Barlow Semi Condensed (my proposal, SIL OFL), 400 and 600, latin
woff2, in `fonts/` with `OFL.txt`. Swapped if the visual pass changes the look.

### PWA

- `manifest.webmanifest`: name Override, portrait, standalone, icons.
- `icons/icon.svg` as source; PNG renders at 192, 512, maskable 512 (80% scale) and 180 (Apple).
- `sw.js`: network first (revalidates past the HTTP cache, 3 s timeout, cache only as offline
  fallback), `CACHE = 'override-1'`, `SHELL` lists every site file including the font, the
  worker and `lang/en.json`; `activate` deletes only other `override-` caches.

### Link preview card

As in Splice: `description`, `og:type`, `og:title`, `og:description`, absolute `og:url`
(`https://thomaslazar.github.io/override/`) and `og:image` (`…/override/icons/og.png`),
`og:image:width` 1200, `og:image:height` 630, `twitter:card` `summary_large_image`, and the Apple
web-app tags. `icons/og.png` (1200 x 630: logo, tagline, board screenshot) is rendered from an
HTML mockup with headless Chromium; not in `SHELL`. Redone after the visual pass.

## Repository

- `index.html`, `style.css`, `manifest.webmanifest`, `sw.js`, `src/`, `lang/`, `fonts/`,
  `icons/`.
- `tests/*.test.mjs`, `tools/sim.mjs`.
- `.github/workflows/pages.yml`: `node --test` on pull requests and pushes; on push to `master`
  it copies the site files to `_site` and deploys to `https://thomaslazar.github.io/override/`.
- `.github/pull_request_template.md`, `.gitignore` (`spike/`, `.superpowers/`, `node_modules/`,
  `*.log`, `.DS_Store`).
- `README.md` (play link, install, how to play, fairness, run locally, licence), `CLAUDE.md`
  (agent notes, file map, rules, as in Splice), `CONTRIBUTING.md` (code, copy, commits),
  `ROADMAP.md` (next steps and parked ideas), `LICENSE.md` (PolyForm Noncommercial 1.0.0).
- `docs/HANDOVER.md` stays; specs and plans in `docs/superpowers/`.
- Setup: `git init` on `master`, first commit, `gh repo create thomaslazar/override --public`,
  Pages from the workflow. Every step that leaves the machine (repo creation, push, Pages) is
  confirmed with the owner first.
- Conventions: Conventional Commits, ask before committing. No attribution to Claude, Claude
  Code or any tool anywhere: no `Co-Authored-By` trailers, no "Generated with" lines, in
  commits, PR bodies, issues or docs. `CLAUDE.md` states this rule under Working rules. No em-dashes in copy or docs; typographic apostrophes (’) in visible text;
  sentence case.

## Testing and balance

- `node --test`:
  - `core.test.mjs`: group shapes and special choice, placement, worm direction (swipe and
    cascade), firing on swap, every combo, chains, blocker hits (one per wave), firewall unlock,
    gravity with diagonal fill and pockets, reshuffle (no match, a valid move), steps match the
    final state, saves round trip.
  - `levels.test.mjs`: determinism, chapters, parameter ranges per difficulty, introduction
    levels, easing (moves and colours), mirrored blockers never seal a row.
  - `bot.test.mjs`: levels 1 to 60 solvable, limit at least the bot's need.
  - `refill.test.mjs`: every weight at least 1, neutral refill uniform, pressure 0 on schedule.
  - `lang.test.mjs`: every file against `en.json`, and `src/ui.js` uses exactly the `en.json`
    keys.
- `tools/sim.mjs [levels] [runs] [--refill nice]`: per level size, colours, goals, bot need,
  limit, margin, regenerations and time; with `--refill nice`, the moves the help saves.
- Rerun tests and the sim after rule or balance changes.
- After the first deploy: load the live URL, check the `og:` tags and that `og.png` resolves.
  Pasting the link into Signal or Discord is the owner's check.

## Open (later specs)

Look and names (tiles in the fiction, specials, blockers), runs and crew comms, gear and shop
with currency, music, the items-down goal, the trace, board shapes, German.
