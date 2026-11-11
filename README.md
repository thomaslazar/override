# Override

An ad-free match-3 for phones. You are the crew’s hacker on site: jack your field deck into
the lock, line up three or more, and crack it before the patrol comes back. Levels are
generated endlessly, every level is checked beatable by a bot, and the board never runs
out of moves.

**Play:** https://thomaslazar.github.io/override/ (work in progress)

## Install on your phone

Override is a progressive web app and works offline once loaded.

- **iPhone (Safari):** tap Share, then “Add to Home Screen”.
- **Android (Chrome):** open the menu, then “Add to Home screen” or “Install app”.

## How to play

Swap two neighbouring tiles to line up three or more of one kind. Four in a line makes a
worm that clears a row or column, an L or T makes a logic bomb, five in a line makes a
zero-day that clears a whole colour. Swap a special to set it off, or swap two specials
together for a bigger effect. Meet every goal before the moves run out.

## Fair by design

No ads, no accounts, no tracking, no lives or timers. Progress is saved in your browser.
Refills lean your way when you’re behind, never against you. Fail a level four times and
each retry gives more moves; keep failing and it drops a colour.

## Run locally

No build step and no dependencies. Serve the folder with any static server:

```
python3 -m http.server 8081
```

Then open http://localhost:8081. Opening `index.html` from disk does not work, because
browsers block ES modules on `file://`. `?level=N` starts level N when playing locally.

- `node --test` runs the unit tests.
- `node tools/sim.mjs` runs the balance bot.

## Docs

- [Roadmap](ROADMAP.md): what comes next.
- [Contributing](CONTRIBUTING.md): conventions for code, copy and commits.
- Specs and plans: `docs/superpowers/`.

Pushes to `master` are tested and deployed to GitHub Pages by
[a workflow](.github/workflows/pages.yml).

## License

[PolyForm Noncommercial 1.0.0](LICENSE.md). Free to play, study, modify and share for any
noncommercial purpose. Commercial use is not permitted without the author’s permission.

The bundled font, Barlow Semi Condensed, is under the [SIL Open Font License 1.1](fonts/OFL.txt).
