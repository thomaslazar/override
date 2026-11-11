# Roadmap

What comes next for Override, roughly in order. Specs and plans for built work are in
`docs/superpowers/`. Each item gets its own spec, plan and branch.

## Next

1. **Drop goal.** Items (in the fiction: data drives, keys, a planted device) start high on the
   board and must be brought down to the bottom row, where they leave the board. They do not
   match and cannot be destroyed; clearing tiles below them lets them fall. A new goal kind
   next to tiles, crack and firewall, with its own spawn rules (only from the top, never more
   on the board than the goal still needs), level generation and bot support. Open: what the
   items are, whether exits are always the whole bottom row or marked cells.

2. **Level score.** A score per level from what you clear: tiles, specials fired, combos,
   blockers cracked, with cascades worth more. Shown in the HUD and on the win sheet, with the
   best score per level kept. Goals still decide win or loss; the score never does.

3. **End-of-level payout.** When a level is won with moves to spare, the board plays out: every
   special on the board fires, each spare move turns a random tile into a worm or bomb that
   fires, and tiles keep dropping and cascading until the board stands still. Everything scores.
   - The payout is part of the pure core (`finale(S)`, seeded), so its result is fixed the
     moment the level is won. The UI only animates its steps.
   - A tap skips the animation and jumps to the final board and score. Skipping never changes
     the result.
   - Saved before it animates, like every move, so closing the app mid-payout loses nothing.
   - Open: its name in the fiction (spare time before the patrol turned into a skim of the
     system?).

4. **Funds.** The level score turns into the in-game currency at the end of each level.
   - Open: the name, the conversion (flat rate, or tied to spare moves so playing well pays
     more than grinding), whether replaying a won level pays, and a per-level cap so funds
     can’t be farmed.
   - Earned only by playing, never bought (see the shop guardrails in `docs/HANDOVER.md`).

5. **Gear and shop.** What funds are spent on: items taken into a level, like starting with a
   worm on the board. Fixed, visible prices, stockpile caps, no sales or timers. Every level
   stays beatable without gear, verified by the bot.

6. **Visual pass.** Settle the look: the physical scene behind the deck, the deck itself, tile
   glyphs and what the tiles are in the fiction, names of specials and blockers. Redo the
   link preview card afterwards.

7. **Runs and crew.** Chapters as small runs feeding a big final run; crew members on comms;
   backgrounds that change with the obstacle and react to progress.

8. **Sound and music.** Reuse Splice’s generated music engine with its own style.

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

## Parked

- Trace: a blocker that spreads if left alone.
- Board shapes with holes and notches.
- German and other translations.
- Casing levels and runs with mechanical impact on the final run.
