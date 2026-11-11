# Contributing

## Code

- No frameworks, no dependencies, no build step unless a feature truly needs one.
- Game rules live in `src/core.js` and `src/levels.js` as pure functions: no DOM, no
  storage. The bot in `src/bot.js` plays the same core, in a Web Worker in the game and
  directly in tests and `tools/sim.mjs`. The UI in `src/ui.js` renders, animates and saves.
- Everything random is seeded, so a level is reproducible. No `Math.random` in `src/`.
- Match the surrounding style: compact, terse JS.

## Copy

- Sentence case, short and plain.
- No em-dashes in UI copy or docs. Use typographic apostrophes (’) in visible text.
- All visible text lives in `lang/`. To add a language, copy `lang/en.json` to
  `lang/<code>.json`, translate the values, and add the code to `lang/languages.json`.

## Tests and balance

- `node --test` runs the unit tests in `tests/`.
- `node tools/sim.mjs` plays levels with the bot and reports need, limit and margin. Rerun it
  after any change to rules, level generation, goals or refills.

## Commits

Conventional Commits: `type: subject`.

- Types: `feat`, `fix`, `docs`, `test`, `ci`, `refactor` (no behaviour change), `chore`.
- Subject: imperative, lowercase, no period, about 72 characters max.
- Body (optional): explain why, not what. Wrap at 72 characters.
- No attribution lines: no `Co-Authored-By` trailers, no "Generated with" lines.
