# Roadmap

What comes next for Override, roughly in order. Specs and plans for built work are in
`docs/superpowers/`.

## Next

- **Visual pass.** Settle the look: the physical scene behind the deck, the deck itself, tile
  glyphs and what the tiles are in the fiction, names of specials and blockers. Redo the
  link preview card afterwards.
- **Runs and crew.** Chapters as small runs feeding a big final run; crew members on comms;
  backgrounds that change with the obstacle and react to progress.
- **Gear and shop.** Items taken into a level, bought with an in-game currency earned only by
  playing, fixed prices, stockpile caps.
- **Sound and music.** Reuse Splice’s generated music engine with its own style.

## Tuning (by playtest)

- Move limit factor `K` and constant `C` in `src/bot.js`.
- Refill weights `REFILL` in `src/core.js`; `node tools/sim.mjs --refill nice` shows what the
  help is worth.
- Difficulty mappings in `paramsFor` (`src/levels.js`).

## Parked

- Bring-items-down goal.
- Trace: a blocker that spreads if left alone.
- Board shapes with holes and notches.
- German and other translations.
- Casing levels and runs with mechanical impact on the final run.
