# Override: agent notes

Override is an ad-free match-3 for phones: vanilla HTML, CSS and ES modules, no build step, no
dependencies, installable as a PWA, deployed to GitHub Pages. Sibling of Kiln and Splice.

This file holds development facts only: commands, files, conventions, rules. Game design and
architecture go in dedicated files under `docs/`.

Read before changing behaviour:
- `docs/architecture.md`: modules, state, algorithms, UI internals. Update it with the code.
- `docs/superpowers/specs/2026-11-11-core-loop-design.md`: rules, levels, fairness.
  Where the architecture notes and the spec disagree, the spec wins.
- `docs/HANDOVER.md`: setting, role, fairness rules, later ideas.
- `CONTRIBUTING.md`: code, copy and commit conventions. Follow them.

## Commands

- Run: `python3 tools/serve.py` (port 8081, sends `Cache-Control: no-store` so phones, Safari included, always load
  fresh files; `python3 -m http.server 8081` also works) and open http://localhost:8081/ (`file://` does not work;
  avoid ports 8000 and 8080, the siblings' service workers control them). `?level=N` starts
  level N fresh. Off GitHub Pages the service worker is unregistered and `override-` caches
  are deleted, so a reload shows the files on disk.
- Test: `node --test` (not `node --test tests/`).
- Balance: `node tools/sim.mjs [levels] [runs] [--refill nice]`, e.g. `node tools/sim.mjs 1-30`.
  Levels are `1-60`, `3,25,50` or a mix (default 1, 3, 5, 10 ... 60). Run `r` plays with
  `fails = r`. Per level it prints board, goals, need, limit, margin, salt, drop and time, plus target (8 + 14 d),
  ratio (need / target), w/m (waves per move) and 4+ (share of moves with 4+ waves), and a summary line.
  `--refill nice` also re-solves with the helpful refill on and prints what it saves.
- Play log report: `node tools/plays.mjs <file> [file ...]` over logs exported from Settings.
- Browser checks: headless Chromium with `--virtual-time-budget` stalls the worker; use real time.
  `node tools/shot.mjs <url> <out.png> [--size WxH] [--dpr N] [--won] [--eval JS] [--reduced-motion]`
  screenshots a page (its Chromium profile lives under `$HOME/override-shots`, because snap
  Chromium cannot use `/tmp`). Check 402 x 706, 375 x 548 and 412 x 820 and look at enlarged crops.
- Link preview card: start the server, run `node tools/shot.mjs http://localhost:8081/tools/og.html icons/og.png --size 1200x630 --dpr 1`,
  then quantise to keep it near 200 KB: `python3 -c "from PIL import Image; Image.open('icons/og.png').convert('RGB').quantize(128).save('icons/og.png', optimize=True)"`.

## Files

- `index.html`: markup (strip with the obstacle plate, comms line, deck with image pieces and stickers, screen with log lines, HUD, board canvas, soft keys, sheet, menu, loading card; no rain). `style.css`: all styles, dark only (terminal windows; the middle log line hides below 780 px height, the whole log below 620 px height).
- `src/core.js`: rules, pure (no DOM, no storage). Tested in `tests/core.test.mjs` and `tests/refill.test.mjs`.
- `src/levels.js`: chapters, difficulty, `paramsFor`, `makeAttempt`, pure. Tested in `tests/levels.test.mjs`.
- `src/bot.js`: greedy bot over the core API, pure; sets each attempt's move limit. Tested in
  `tests/bot.test.mjs`. `tools/sim.mjs`: balance report with it.
- `src/plays.js`: opt-in play log (pure, tested in `tests/plays.test.mjs`); `tools/plays.mjs`: report over
  exported logs (`tests/plays-report.test.mjs`).
- `src/worker.js`: Web Worker that runs `prepare(level, fails, pick)` off the main thread.
- `src/ui.js`: language, worker client, view model, step animation, drawing (canvas), effects, win art, input, sheets, menu, saving.
- `src/palette.js`: `PALETTES` (standard and colour-blind tile colours) and `paletteFor`, pure. Tested in `tests/palette.test.mjs`.
- `lang/`: all visible text. `languages.json` maps codes to own-language names (only `en` now);
  `<code>.json` holds flat `"key": "text"` pairs with `{placeholders}`. `tests/lang.test.mjs` checks them.
  `tests/helpers.mjs` has shared test builders.
- `fonts/`: Barlow Semi Condensed (latin 400 and 600) and Share Tech Mono (latin 400, terminal text), woff2, self-hosted, with `OFL.txt`.
- `art/`: generated WebP images (lock plates, deck frame, plug, keys, stickers). Everything drawn on the board is code. `docs/art.md` has the prompts, cut-out steps and rules. All of `art/` and `fonts/` must be in `SHELL` and the workflow copy; `tests/shell.test.mjs` checks this.
- `manifest.webmanifest`, `sw.js`, `icons/`: PWA. `sw.js` is network first (revalidates; 3 s
  bounds the wait for response headers only, cache is the offline or slow fallback). `CACHE` is `override-5`; rename it when `sw.js`
  changes how it caches or `SHELL` changes, so `activate` drops the old cache (only `override-`
  caches). `icons/og.png` (1200 x 630) is the link preview card, rendered from `tools/og.html`; not in `SHELL`.
  App icons (a 3 x 3 board with a lit row of three メ; `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` 180, `icon-maskable-512.png`) are rendered
  from `tools/icon.html?size=N` (add `&mask=1` for the maskable one) with `tools/shot.mjs --size NxN --dpr 1`.
- `.github/workflows/pages.yml`: runs `node --test` on pull requests and pushes; on push to
  `master` it deploys to https://thomaslazar.github.io/override/. New site files must be added
  to its copy step and, if needed offline, to `SHELL` in `sw.js`. `.github/pull_request_template.md`: PR checklist.
- `README.md`, `ROADMAP.md`, `CONTRIBUTING.md`, `LICENSE.md` (PolyForm Noncommercial 1.0.0).
- `spike/`: the throwaway prototype. Not part of the game.
- `docs/`: `architecture.md` (how the code works); `HANDOVER.md`; `art.md` (image workflow); `research/`; `superpowers/` holds the specs and plans (the visual overhaul spec wins on looks).

## Working rules

- Every `localStorage` key and cache name starts with `override-` (now `override-v1`,
  `override-run`, `override-lang`, `override-palette`, `override-plays`, `override-best`, `override-5`; the old `override-theme` is ignored, not deleted); the origin is shared with
  Kiln and Splice, and `sw.js` only deletes `override-` caches.
- Conventional Commits. Ask before committing unless the owner has said otherwise for the
  current work. Work happens on one branch per plan, merged into `master` locally; no pull
  requests. The process:
  - A brainstorm that leads to a spec, plan and implementation runs on its own branch.
  - The owner tests that branch, and it is iterated on (fixes and additions on the same branch)
    until the owner is content.
  - **Merge into `master` only on the owner's go-ahead.**
  - **Never push to origin without the owner's go-ahead for that push.**
- **No attribution of any kind.** Never add `Co-Authored-By:` trailers or "Generated with"
  lines (Claude, Claude Code or any other tool) to commits, PR bodies, issues or docs.
- No em-dashes in UI copy or docs. Use typographic apostrophes (’) in visible text.
- Rerun `node --test` and the sim after rule or balance changes.
- Keep `docs/architecture.md` in step with the code; design decisions go in a spec under `docs/superpowers/specs/`.
- New site files go into the workflow's copy step and, if needed offline, into `SHELL`.
