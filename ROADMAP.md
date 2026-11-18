# Roadmap

What comes next for Override. Specs and plans for built work are in `docs/superpowers/`; each
item below gets its own spec, plan and branch. The visual pass (terminal look, generated art, effects, colour-blind palette) is done; names in
the fiction are still working names.

## Next, in order

1. **Funds, gear and shop** (one piece of work, next). The level score turns into funds; funds buy gear
   taken into a level from the level start screen, and tools used during a level.
   - Funds: earned only by playing, never bought. Open: the name, the conversion (flat, or weighted to
     spare moves so playing well pays more than grinding), whether replaying a won level pays, a
     per-level cap so funds can’t be farmed.
   - Gear taken into a level: start with a worm, bomb or zero-day on the board, or a few extra moves.
   - Tools used during a level: break one cell, swap any two tiles without a match, reshuffle.
   - Fixed, visible prices, a small stockpile cap per item, no sales, bundles or timers.
   - Every level stays beatable without gear, verified by the bot. Gear makes a level easier,
     never possible.

2. **More blockers.** The genre’s usual set, in the fiction:
   - **ICE:** a hardened cell that matches next to it do not touch; only worms, bombs and
     zero-days break it. One to three layers. The wall around a set piece.
   - **Logs** (a mark under a tile, cleared by a match on top of it, one or two layers) with a
     goal to scrub them all. The genre’s most common goal.
   - **Trace:** spreads to a neighbouring cell on every move that clears none of it.
   - **Tripwire:** a tile with a countdown; when it reaches zero the level is lost unless it
     was cleared. Used sparingly, never on early levels.
   - **Spreading access:** the reverse of trace, a goal that spreads wherever you match next to
     it (“plant access”, from the handover).
   - **Malware** (an idea from a friend of the owner): ICE that infects your deck when you jack
     in. Every few moves a fake pop-up ad for an in-game company covers part of the deck screen,
     like a roofing firm’s “Hot shingles in your neighbourhood!” or a Splice corporation’s
     product. Closing it means hunting for the tiny `[x]`. A parody of the ad-riddled genre in
     an ad-free game. Fairness: a pop-up never costs a move, never hides the move counter for
     long, and never makes a level unbeatable; it only gets in the way. Open: whether pop-ups
     are pure screen clutter (no rule change, the bot ignores them) or cover board cells until
     closed, how often they appear, and the ad copy (a pool of seeded lines in `lang/`).
   - Later candidates: conveyor buses that move tiles each turn, tunnels that link two cells,
     nodes that keep producing a blocker.

3. **New player experience (NPE).** No dedicated tutorial mission like Splice's; teach in place.
   - An intro card the first time something new shows up: each blocker (encrypted cells, firewalls,
     later ICE, logs, trace, malware), each special (worm, logic bomb, zero-day) the first time one is
     made, each goal kind, and later mechanics (drops, teleporters). A short terminal window with the
     piece drawn as on the board, one or two lines of what it does and how to beat it, and OK.
   - Shown once per player (seen list in a new `override-` key), with a way to see them again from
     the Info tab. Never costs a move; the board waits under it.
   - Today only the comms line mentions encrypted cells (level 4), firewalls (level 7) and drops
     (level 21); the cards replace that.
   - The idle hint exists (the swap wriggles after 10 s when only one or two exist); open whether it
     should show on any board and be switchable in settings.
   - Open: whether the first levels also get a guided first move (a pointing hand on a set swap).

4. **Sticker collecting.** One sticker per corporation hacked, collected on a sticker wall.
   The deck's four stickers are fixed decoration today; see `docs/art.md` for how they are made.

5. **More win screens.** PWNED is the only win art today. Add a few more in the same block-letter
   ASCII style, picked at random per win: REKT, OWNED, ROOTED, ACCESS GRANTED, GG and similar,
   each with its own small ASCII picture next to the padlock (an open door, a skull, a terminal).
   Decoration, not translated, static under reduced motion like PWNED.

6. **More obstacle plates.** Camera hub, server rack and card reader, each a locked and an
   open plate in the same framing as the maglock (`docs/art.md`).

7. **Runs and crew.** Chapters as small runs feeding a big final run; a map of the run showing
   progress; crew members on comms with names; backgrounds that change with the obstacle
   (maglock, camera hub, server rack) and react to progress, like a door unlocking on the
   last level of a run.

8. **Sound and music.** Reuse Splice’s generated music engine with its own style; sound effects
   for matches, specials and the payout; mute in settings.

## Done

- **Board layouts, drops and teleporters** (merged 2026-11-16). Spec:
  `docs/superpowers/specs/2026-11-14-board-layouts-design.md`. Holes, blocks, spawners anywhere, blocker
  patterns, teleporters (from level 16), drop tiles and drop points (from level 21), the template library.
  Research: `docs/research/2026-11-11-level-layouts.md`, `docs/research/2026-11-11-layout-gallery.md`.
- **Board shapes and the level start screen** (merged 2026-11-16). Spec:
  `docs/superpowers/specs/2026-11-16-board-shapes-design.md`. Boards from 5 to 9 wide and 5 to 11 tall,
  islands and compositions, 153 templates, the thin photo strip, the compact terminal, a start screen
  before every level (DECKER’s line and the mechanic hints moved there). Research:
  `docs/research/2026-11-16-board-designs.md`, `docs/research/2026-11-16-board-shapes-second-pass.md`.
- **Level score.** A score per level from what you clear: tiles, specials fired, combos, blockers
  broken, with cascades worth more. Shown in the HUD and on the win sheet, best score per level kept.
  Stars were dropped. Goals still decide win or loss; the score never does.
- **End-of-level finale.** When a level is won with moves to spare, every special left fires, then spare
  moves go in rounds of 5, each turning that many random tiles into worms or bombs that fire together.
  Part of the pure core (`finale(S)`, seeded), saved before it animates; a tap skips the animation.

## Later

- **Casing levels:** lighter scouting levels before a run, whose results change the run.
- **Runs with mechanical impact:** a finished small run gives the final run an edge (a starting
  special, fewer blockers), like intel in Splice.
- **German and other translations.** The language system is in place; add `de.json`.
- **Statistics:** levels won, best scores, specials made.
- **Drop point per kind:** a drop point that takes only one drop kind, so two kinds must reach
  different exits.
- **Blocks stop blasts:** blocks that stop worm and bomb blasts instead of letting them pass over,
  so a wall shields what is behind it.
- **Layered generation (B):** boards combined from small libraries (shape, flow of spawners,
  teleporters and drops, blocker pattern), validated, for far more variety than whole templates.

## Not doing

These are the genre’s pay-to-win parts, which Override exists to leave out:

- Lives, energy or waiting timers.
- Buying currency, moves or gear with money.
- Extra moves offered on a loss.
- Ads, accounts, tracking, limited offers.

## Polish

- Levels that run long for the bot: cisterns (level 119), decks (level 143); many boards sit at the
  lowest effort already.
- Older templates come up less often since the library grew to 153.

- Toast sits over the Share button in the menu.
- Sheets and the menu have no dialog roles for screen readers.

## Tuning (by playtest)

- Move limit factor `K` and constant `C` in `src/bot.js`.
- Refill weights `REFILL` in `src/core.js`; `node tools/sim.mjs --refill nice` shows what the
  help is worth.
- Difficulty mappings in `paramsFor` (`src/levels.js`): colours are 5, or 6 above d = 0.8.
- `DAMP` (`src/core.js`, chance a settled refill line survives) and `GOAL` (`src/levels.js`, tile goal
  factor); tune with `node tools/sim.mjs` (target, ratio, w/m, 4+ columns).
- Use the play log: turn it on in Settings, play, Download log, run
  `node tools/plays.mjs <file> [file ...]`.
