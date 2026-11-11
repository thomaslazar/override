# Roadmap

What comes next for Override. Specs and plans for built work are in `docs/superpowers/`; each
item below gets its own spec, plan and branch. Names in the fiction are working names until the
visual pass settles them.

## Next, in order

1. **Board layouts.** Levels stop being plain squares. Layout is the genre’s biggest
   difficulty lever and the biggest gap today.
   - Shapes: void cells for holes, notches, missing corners, rings, diagonal cuts.
   - Templates: a library of 15 to 25 hand-drawn layouts (string grids with tags such as
     `walled`, `funnel`, `split`), rotated and mirrored for variety. `makeAttempt` picks one by
     difficulty band and seed and fills it with goals, blockers and tiles as today. King keeps
     layouts hand-made too and uses bots only to test them.
   - Blockers placed by the template (a walled centre, a funnel, a bottleneck) instead of only
     in random mirrored pairs.
   - Spawn points: tiles drop in only from marked cells, not the whole top row; every region
     stays fed so no part of the board goes dead.
   - The bot falls back to a simpler template when no seed passes; `tools/sim.mjs` prints the
     template name. A test checks every template has a legal move and every region is fed.
   - Open: whether some levels are fully hand-made.

2. **Drop goal.** Items (data drives, keys, a planted device) start high or come from a
   dispenser and must be brought to an exit, where they leave the board. Exits are the bottom
   row of their column or marked cells. They do not match and cannot be destroyed; clearing
   tiles below lets them fall. A drop can be swapped with a neighbouring tile when the swap
   makes a match for that tile, so drops also move up and sideways, not only down. Never more
   on the board than the goal still needs. The bot needs a sense of how far each drop is from
   its exit, or it won’t finish these levels.

3. **Teleporters and islands.**
   - Teleporters: an ingress and an egress, placed anywhere on the board. Whatever falls out
     of the bottom of the ingress cell comes in at the top of the egress cell. One way only.
     Tiles, drops and specials pass through; a worm’s blast and matches do not reach across.
     Drawn as a marked pair, with a glyph as well as colour.
   - Teleporter layouts are part of the template library. Examples:
     - Snake: each column’s bottom leads to the top of the next column, so a drop starting top
       left travels the whole board to an exit on the far side.
     - Feeder: an island with no spawn point gets its tiles from another part of the board.
     - Crossover: the left half drains into the right half, or the bottom of one island into
       the top of another, so drops change sides or levels.
     - Mid-board egress: tiles come in below a wall instead of from the top.
   - Islands: parts of the board cut off from the rest, each fed by its own spawn point or a
     teleporter exit. Set pieces like a three-column island holding the drops, walled in by
     ICE that only specials break.
   - Research on how the genre lays out levels: `docs/research/2026-11-11-level-layouts.md`;
     50 real levels transcribed and 26 template candidates: `docs/research/2026-11-11-layout-gallery.md`.

4. **More blockers.** The genre’s usual set, in the fiction:
   - **ICE:** a hardened cell that matches next to it do not touch; only worms, bombs and
     zero-days break it. One to three layers. The wall around a set piece.
   - **Logs** (a mark under a tile, cleared by a match on top of it, one or two layers) with a
     goal to scrub them all. The genre’s most common goal.
   - **Trace:** spreads to a neighbouring cell on every move that clears none of it.
   - **Tripwire:** a tile with a countdown; when it reaches zero the level is lost unless it
     was cleared. Used sparingly, never on early levels.
   - **Spreading access:** the reverse of trace, a goal that spreads wherever you match next to
     it (“plant access”, from the handover).
   - Later candidates: conveyor buses that move tiles each turn, tunnels that link two cells,
     nodes that keep producing a blocker.

5. **Level score.** A score per level from what you clear: tiles, specials fired, combos,
   blockers broken, with cascades worth more. Shown in the HUD and on the win sheet, best score
   per level kept. One to three stars by score. Goals still decide win or loss; the score never
   does.

6. **End-of-level payout.** When a level is won with moves to spare, the board plays out: every
   special on the board fires, each spare move turns a random tile into a worm or bomb that
   fires, and tiles keep dropping and cascading until the board stands still. Everything scores.
   - Part of the pure core (`finale(S)`, seeded), so the result is fixed the moment the level
     is won. The UI only animates its steps.
   - A tap skips the animation and jumps to the final board and score. Skipping never changes
     the result.
   - Saved before it animates, so closing the app mid-payout loses nothing.
   - Open: its name (spare time before the patrol turned into a skim of the system?).

7. **Funds.** The level score turns into the in-game currency at the end of each level.
   - Open: the name, the conversion (flat, or weighted to spare moves so playing well pays
     more than grinding), whether replaying a won level pays, a per-level cap so funds can’t be
     farmed.
   - Earned only by playing, never bought.

8. **Gear and shop.** What funds buy.
   - Gear taken into a level: start with a worm, bomb or zero-day on the board, or a few extra
     moves.
   - Tools used during a level: break one cell, swap any two tiles without a match, reshuffle.
   - Fixed, visible prices, a small stockpile cap per item, no sales, bundles or timers.
   - Every level stays beatable without gear, verified by the bot. Gear makes a level easier,
     never possible.

9. **Help for new players.** A short explanation the first time each special, blocker and goal
   appears, shown on the board. A hint (a glowing valid move) after a few idle seconds,
   switchable in settings.

10. **Visual pass.** Settle the look: the scene behind the deck, the deck, what tiles are in the
   fiction, names of specials, blockers and the currency. Redo the link preview card.

11. **Runs and crew.** Chapters as small runs feeding a big final run; a map of the run showing
    progress; crew members on comms with names; backgrounds that change with the obstacle
    (maglock, camera hub, server rack) and react to progress, like a door unlocking on the
    last level of a run.

12. **Sound and music.** Reuse Splice’s generated music engine with its own style; sound effects
    for matches, specials and the payout; mute in settings.

## Later

- **Casing levels:** lighter scouting levels before a run, whose results change the run.
- **Runs with mechanical impact:** a finished small run gives the final run an edge (a starting
  special, fewer blockers), like intel in Splice.
- **German and other translations.** The language system is in place; add `de.json`.
- **Statistics:** levels won, best scores, specials made.

## Not doing

These are the genre’s pay-to-win parts, which Override exists to leave out:

- Lives, energy or waiting timers.
- Buying currency, moves or gear with money.
- Extra moves offered on a loss.
- Ads, accounts, tracking, limited offers.

## Polish

- Toast sits over the Share button in the menu.
- Sheets and the menu have no dialog roles for screen readers.
- The HUD jumps to the final goal counts on the first wave instead of counting along.
- The board leaves empty space above and below it on tall phones.
- The worm glyph is cramped at phone size.

## Tuning (by playtest)

- Move limit factor `K` and constant `C` in `src/bot.js`.
- Refill weights `REFILL` in `src/core.js`; `node tools/sim.mjs --refill nice` shows what the
  help is worth.
- Difficulty mappings in `paramsFor` (`src/levels.js`).
