# Roadmap

What comes next for Override. Specs and plans for built work are in `docs/superpowers/`; each
item below gets its own spec, plan and branch. Names in the fiction are working names until the
visual pass settles them.

## Next, in order

1. **Board layouts.** Levels stop being plain squares.
   - Shapes: holes, notches, missing corners, rings, diagonal cuts.
   - Islands: parts of the board cut off from each other, each with its own fill from above
     (an island with no column reaching the top gets its own spawn points).
   - Spawn points: tiles only drop in from marked cells, not the whole top row.
   - Set pieces: for example a three-column island holding the drop items, walled in by
     blockers that only specials can break.
   - Generation: a library of hand-drawn layouts that the generator fills with blockers, goals
     and tiles by difficulty, verified by the bot like today. Mirrored and flipped variants
     multiply the library. Open: how many layouts, and whether some levels are fully hand-made.
   - Gravity, diagonal fill, reshuffle and the bot must handle all shapes.

2. **Drop goal.** Items (data drives, keys, a planted device) start high and must be brought to
   an exit, where they leave the board. They do not match and cannot be destroyed; clearing
   tiles below lets them fall. They spawn only from the top, never more on the board than the
   goal still needs. Exits are the bottom row of their column or marked cells. Works with
   layouts (drops in a walled island).

3. **More blockers.** The genre’s usual set, in the fiction:
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

4. **Level score.** A score per level from what you clear: tiles, specials fired, combos,
   blockers broken, with cascades worth more. Shown in the HUD and on the win sheet, best score
   per level kept. One to three stars by score. Goals still decide win or loss; the score never
   does.

5. **End-of-level payout.** When a level is won with moves to spare, the board plays out: every
   special on the board fires, each spare move turns a random tile into a worm or bomb that
   fires, and tiles keep dropping and cascading until the board stands still. Everything scores.
   - Part of the pure core (`finale(S)`, seeded), so the result is fixed the moment the level
     is won. The UI only animates its steps.
   - A tap skips the animation and jumps to the final board and score. Skipping never changes
     the result.
   - Saved before it animates, so closing the app mid-payout loses nothing.
   - Open: its name (spare time before the patrol turned into a skim of the system?).

6. **Funds.** The level score turns into the in-game currency at the end of each level.
   - Open: the name, the conversion (flat, or weighted to spare moves so playing well pays
     more than grinding), whether replaying a won level pays, a per-level cap so funds can’t be
     farmed.
   - Earned only by playing, never bought.

7. **Gear and shop.** What funds buy.
   - Gear taken into a level: start with a worm, bomb or zero-day on the board, or a few extra
     moves.
   - Tools used during a level: break one cell, swap any two tiles without a match, reshuffle.
   - Fixed, visible prices, a small stockpile cap per item, no sales, bundles or timers.
   - Every level stays beatable without gear, verified by the bot. Gear makes a level easier,
     never possible.

8. **Help for new players.** A short explanation the first time each special, blocker and goal
   appears, shown on the board. A hint (a glowing valid move) after a few idle seconds,
   switchable in settings.

9. **Visual pass.** Settle the look: the scene behind the deck, the deck, what tiles are in the
   fiction, names of specials, blockers and the currency. Redo the link preview card.

10. **Runs and crew.** Chapters as small runs feeding a big final run; a map of the run showing
    progress; crew members on comms with names; backgrounds that change with the obstacle
    (maglock, camera hub, server rack) and react to progress, like a door unlocking on the
    last level of a run.

11. **Sound and music.** Reuse Splice’s generated music engine with its own style; sound effects
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
