# Visual Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give Override its gritty hacker look (lock close-up strip, deck from image pieces, glowing character tiles, new specials, blockers, effects, terminal windows, win art, colour-blind palette) without touching rules, levels, bot or saves.

**Architecture:** Port the approved throwaway build on branch `spike/visual-overhaul` onto this branch in reviewed steps, then add what it skipped. Read spike files with `git show spike/visual-overhaul:<path>`; never check that branch out or merge it. Only `index.html`, `style.css`, `src/ui.js`, `lang/en.json`, `sw.js`, the workflow, assets, docs, tools and tests change; `src/core.js`, `src/levels.js`, `src/bot.js`, `src/worker.js` must not change.

**Tech Stack:** Vanilla HTML, CSS, ES modules, canvas 2D; Node's built-in test runner; headless Chromium (`/snap/bin/chromium`) driven over CDP for browser checks.

**Spec:** `docs/superpowers/specs/2026-11-13-visual-overhaul-design.md` (read it first; its numbers are binding).

## Global Constraints

- No build step, no dependencies. No `Math.random` in `src/` (use `hash`/`mulberry32` from `src/core.js`).
- Every `localStorage` key and cache name starts with `override-`; new key `override-palette`; `CACHE` becomes `override-3`.
- All visible text comes from `lang/en.json` via `t(key)`; the "UI uses exactly the keys in en.json" test must stay green. Exception: the win art (ASCII padlock, `PWNED` letters) is decoration, not text.
- No em-dashes in copy or docs; typographic apostrophes (’) in visible text.
- Dark only: one set of tokens on `:root`, `color-scheme: dark`, no theme switch; `override-theme` is ignored (not deleted). `<meta name="theme-color" content="#0b0c0e">`.
- `prefers-reduced-motion`: no idle animation (worm dashes, bomb pins, zero-day ring, encrypted static, firewall flames), no effects, win art static on the open padlock frame.
- Conventional Commits, one commit per task at least. **No attribution of any kind** (no `Co-Authored-By`, no "Generated with") in commits or files.
- Run with `python3 -m http.server 8081` from the repo root; `node --test` (not `node --test tests/`).
- Browser checks: real time, never `--virtual-time-budget` (it stalls the worker). Inspect enlarged crops of screenshots, not only the full frame.

## Review Focus

1. Short phone viewport 375 x 548: the board must still be at least 275 px wide and nothing overlaps (Task 2 browser check).
2. Reduced motion: no animation anywhere, win art shows the open padlock still (Tasks 3, 4, 5 browser check with emulated `prefers-reduced-motion`).
3. Reloading a won level: strip shows the open plate and the win window appears; Restart level shows the locked plate (Task 5 browser check).
4. Palette switch: board and HUD icons change at once, choice survives a reload (Task 6 test plus browser check).
5. Offline install: every file in `art/` and `fonts/` is in `SHELL` and copied by the workflow (Task 1 test).

---

### Task 1: Assets, fonts and PWA plumbing

**Files:**
- Create: `art/*.webp` (10 files), `fonts/share-tech-mono-latin-400.woff2`, `tests/shell.test.mjs`
- Modify: `sw.js` (`CACHE`, `SHELL`), `.github/workflows/pages.yml` (copy step), `fonts/OFL.txt` (credit), `lang/en.json` (`font` key)

**Interfaces:**
- Produces: asset paths `art/lock-closed.webp`, `art/lock-open.webp`, `art/deck.webp`, `art/plug.webp`, `art/key-l.webp`, `art/key-r.webp`, `art/sticker-eye.webp`, `art/sticker-skull.webp`, `art/sticker-voidwalk.webp`, `art/sticker-42.webp`; font family `"Share Tech Mono"` file.

- [ ] **Step 1: Write the failing test** `tests/shell.test.mjs`:
  - `test('every art and font file is in SHELL')`: read `sw.js`, extract the `SHELL` array strings, assert every file in `art/` and `fonts/` (except `OFL.txt`) is listed.
  - `test('the workflow copies art')`: read `.github/workflows/pages.yml`, assert the `cp -r` line contains ` art `.
  - `test('cache name is override-3')`: assert `sw.js` contains `const CACHE = 'override-3'`.
- [ ] **Step 2: Run** `node --test` and expect the three new tests to FAIL.
- [ ] **Step 3: Copy the assets from the spike** exactly as they are: `git checkout spike/visual-overhaul -- art fonts/share-tech-mono-latin-400.woff2` (takes the latest `deck.webp` and `plug.webp`).
- [ ] **Step 4: Update** `sw.js` (`CACHE = 'override-3'`, add the 10 art files and the font to `SHELL`), the workflow `cp -r` line (add `art`), `fonts/OFL.txt` (add a line crediting Share Tech Mono, Copyright Carrois Apostrophe, SIL OFL 1.1), `lang/en.json` `font` text to name both fonts (e.g. "Fonts: Barlow Semi Condensed and Share Tech Mono, SIL Open Font License.").
- [ ] **Step 5: Run** `node --test`; expect all PASS.
- [ ] **Step 6: Commit** `feat: add overhaul art and terminal font to the app shell`.

### Task 2: Layout, styles and a browser-check tool

**Files:**
- Create: `tools/shot.mjs`
- Modify: `index.html` (body, theme-color, font preload), `style.css` (replace), `src/ui.js` (scene, rain, theme, log lines), `lang/en.json`

**Interfaces:**
- Consumes: Task 1 assets.
- Produces: DOM ids `#strip`, `#comms`, `#who`, `#line`, `#deckwrap`, `#deck`, `#screen`, `#log`, `#log2`, `#log3`, `#deckName`, `#levelLabel`, `#hud`, `#goals`, `#patrol`, `#patrolLabel`, `#moves`, `#wrap`, `#board`, `#soft`, `#menuBtn` (class `soft`), `#wip`, `#toast`, `#loading`, `#sheet`, `#card`, `#menu`, `#turn`; `unlockScene(open: boolean)` toggles `#strip.open`; `readPal()` replaces `applyTheme()`; CSS custom property `--mono` (font stack); `tools/shot.mjs` CLI.

- [ ] **Step 1: Port `index.html` body and `style.css`** from `git show spike/visual-overhaul:index.html` / `:style.css` (the final spike versions include the phone fixes: strip `clamp(110px,22dvh,200px)`, comms at the top of the strip, deck border widths `47px 30px 47px 30px` with slices `188 128 189 128`, plug `top:-95px`, keys `top:-56px` 58 px in, `#log2` hidden below 780 px height, `#log` hidden below 620 px). Keep the stickers' exact inline positions. Restyle `#turn` as a terminal line (mono font, `--term` colour).
- [ ] **Step 2: Port the `src/ui.js` non-drawing changes** from the spike: `unlockScene` toggles `#strip.open`; rain section, `#rain` and `sizeRain` removed; `applyTheme` and the theme listener removed, `readPal()` called at boot; the theme segment removed from the Settings tab; `hud()` fills `#log2`/`#log3` with `t('logHandshake')`/`t('logInject')`. Leave the board drawing as it is for now (Task 3 replaces it). `lang/en.json`: remove `theme`, `themeAuto`, `themeLight`, `themeDark`; add `logHandshake` "handshake ok · cipher weak", `logInject` "injecting payload".
- [ ] **Step 3: Write `tools/shot.mjs`**: `node tools/shot.mjs <url> <out.png> [--size WxH] [--won] [--eval JS] [--reduced-motion]`. Launches `/snap/bin/chromium --headless` with a fresh `--user-data-dir` under `os.tmpdir()` and a free debugging port, CDP: `Network.setCacheDisabled`, `Emulation.setDeviceMetricsOverride` (mobile, DPR 2, default 402x706), `Emulation.setEmulatedMedia` for reduced motion, waits 7 s real time; `--won` sets every goal's `got` to `need` in `localStorage['override-v1']` and reloads without the query; `--eval` runs JS then waits 1.5 s; prints `id:top+height x width` for `strip comms deck log hud wrap board soft` and any console errors; writes the PNG. Port the approach of the session scripts (the spike's checks used the same CDP calls).
- [ ] **Step 4: Run** `node --test` (PASS) and browser checks with the server running:
  `node tools/shot.mjs "http://localhost:8081/?level=6" /tmp/o-402.png`, then `--size 375x548` and `--size 412x820`.
  Expected: no console errors; board width 318 at 402x706, at least 275 at 375x548, 328 at 412x820; in enlarged crops the comms band does not cover the LOCKED display, the plug sits on the deck's top edge, stickers sit on the metal.
- [ ] **Step 5: Commit** `feat: gritty strip and deck layout, dark only`.

### Task 3: Board drawing

**Files:**
- Modify: `src/ui.js` (drawing section, `icon()`)

**Interfaces:**
- Consumes: `PAL` from `readPal()` (`PAL.t[0..6]`, `PAL.enc`, `PAL.encInk`, `PAL.fw`, `PAL.cell`, `PAL.sel`), `--mono`.
- Produces: `GLYPHS = ['ｱ','ﾊ','ｦ','7','Ξ','ﾐ','Z']`, `glyph(ty, cx, cy, size, alpha=1)`, `drawWorm(ty, cx, cy, size, vertical)`, `drawBomb(ty, cx, cy, size)`, `drawZero(cx, cy, size)`, `drawFw(cx, cy, size)`, `drawEnc(cx, cy, hp, size=cs)`, `drawTile(x, cx, cy, sc=1)`; a `now()` helper returning 0 under reduced motion.

- [ ] **Step 1: Port the drawing functions** from the spike's `src/ui.js` (`GLYPHS` through `drawEnc`, and `icon()`), replacing `poly`, `glyphPath`, `edge`, `hole` and the old `drawFw`/`drawTile`/`drawEnc`. Keep the spec's looks exactly (worm capsule with chevrons and running dashes, chip with 12 pins lighting in turn and a blinking red fuse, zero-day ring of the level's colours around a white core with `0`, encrypted static with double/single/dashed amber outline for 3/2/1 hits, firewall flame frame with three cage bars over the full-colour tile). Fix the spike's shadowing: inside `drawTile` the size variable must not be called `S`; `drawZero` reads the level's colours from the current attempt `S` (`S.k`, `S.types`).
- [ ] **Step 2: Run** `node --test` (PASS) and `node tools/shot.mjs "http://localhost:8081/?level=12" /tmp/o-board.png --eval "<inject>"` where the inject script turns some tiles of the saved `override-v1` into `h`, `v`, `b`, one `z` and one locked tile, then reloads (the spike check did exactly this). Expected in an enlarged crop: each special and blocker as in the spec, goal icons in the HUD drawn with the new look; with `--reduced-motion` two screenshots 1 s apart are identical.
- [ ] **Step 3: Commit** `feat: glowing character tiles, new specials and blockers`.

### Task 4: Effects

**Files:**
- Modify: `src/ui.js` (`flash`, `flashShape`, the `fx` pass in `frame`, `animate` wave step)

**Interfaces:**
- Consumes: Task 3 drawing, `animate(steps)` step shapes (`wave.fired[{i, s}]`, `combo {i, kind}`, `wave.cracked[{i, hp}]`).
- Produces: effect kinds drawn in `frame`: worm streak (`h`, `v`), bomb shockwave (`b`, `bb`), area fill (`ww`, `bw`, `zz`, `zw`, `zb`, `z`), crack (amber).

- [ ] **Step 1: Implement the effects** with the spec's numbers: timing unchanged (flash 320 ms, pop 240 ms, linear fade). Worm: a glowing bar 0.35 cells thick along the whole row or column in the worm's tile colour (pass the colour into `flash`). Bomb: a square outline growing from 1 to 3 cells (5 for `bb`) around the cell, line width 0.12 cells, white-green (`#c9ffd9`). `ww`, `bw`, `zz`, zero-day (`z`, `zw`, `zb`): the existing area shapes filled `#c9ffd9` at 35 % alpha, fading. Crack: amber (`PAL.encInk`) outline growing slightly, fading. Win flourish keeps using worm streaks. Reduced motion: no effects (as today).
- [ ] **Step 2: Run** `node --test` (PASS); browser check: play one match on a board with a worm next to a match via `--eval` (swap by dispatching pointer events on `#board`) and screenshot 100 ms after; expected a coloured streak across the row. If dispatching is unreliable, verify by code review and note it in the report.
- [ ] **Step 3: Commit** `feat: streak, shockwave and flash effects`.

### Task 5: Terminal windows and win art

**Files:**
- Modify: `src/ui.js` (`showSheet`, `closeSheet`, `win`, art), `style.css` (only if Task 2 missed window rules)

**Interfaces:**
- Consumes: `showSheet(title, text, buttons, dismiss)`, `PAL.t`, `hash`.
- Produces: `showSheet(title, text, buttons, dismiss, art)`; `PADLOCK` (two frames, same body size, shackle and keyhole centred), `PWNED` (5 rows of `█`), `animateArt(pre, canvas)`, `artTimer` cleared in `closeSheet`.

- [ ] **Step 1: Port** the spike's final `showSheet` with `art`, `PADLOCK`, `PWNED`, `animateArt` (block letters drawn as 6 px pixels on a canvas, rows cycling through `PAL.t`, glitch via `hash(k, i, x) % 5 === 0` every 9th tick, 140 ms interval; padlock frame 0 locked, 1 open, toggling every 4 ticks; reduced motion: frame 1, no interval). `.ascL` is `display:table; margin:auto; text-align:left`. Comfortable gaps: padlock 14 px above `PWNED`, `PWNED` 16 px above the title.
- [ ] **Step 2: Strip state**: `start()` shows the locked plate; `win()` (also on a reloaded won state) shows the open plate; Restart level goes back to locked.
- [ ] **Step 3: Run** `node --test` (PASS) and browser checks: `--won` at 402x706 and 375x548 (win window fits, padlock centred over its body in an enlarged crop, PWNED crisp, strip shows the open plate); `--eval "document.getElementById('menuBtn').click()"` (menu as a terminal window, Settings without a theme switch); `--won --reduced-motion` (open padlock, no cycling).
- [ ] **Step 4: Commit** `feat: terminal windows and PWNED win art`.

### Task 6: Colour-blind palette

**Files:**
- Create: `src/palette.js`, `tests/palette.test.mjs`
- Modify: `src/ui.js` (`readPal`, Settings tab), `style.css` (drop `--t0..--t6`), `lang/en.json`

**Interfaces:**
- Produces: `src/palette.js` exports `PALETTES = { standard: [...7], colourblind: [...7] }` and `paletteFor(name) -> string[7]` (unknown name gives `standard`); UI stores the choice in `override-palette` and `readPal()` sets `PAL.t = paletteFor(stored)`.

- [ ] **Step 1: Write the failing test** `tests/palette.test.mjs`:
  - standard is exactly `['#3dff8a','#35c2d9','#ff4fa3','#f2c230','#a77cf0','#ff6a2b','#e9f0ff']`;
  - colourblind is exactly `['#56b4e9','#e69f00','#f0e442','#009e73','#0072b2','#d55e00','#cc79a7']` reordered so that neighbouring entries differ in relative luminance by at least 0.08 (assert that property, not a fixed order);
  - both have 7 distinct colours; `paletteFor('nope')` equals standard.
- [ ] **Step 2: Run** `node --test`; expect FAIL (module missing).
- [ ] **Step 3: Implement** `src/palette.js` (pure, no DOM), pick an order of the colour-blind set that passes; wire `readPal()`; add a Settings row "Colours" with two buttons "Standard" / "Colour-blind" (keys `palette`, `paletteStandard`, `paletteColourblind`); switching stores the key, calls `readPal()`, `hud()`, and the board redraws next frame. Remove `--t0..--t6` from `style.css`.
- [ ] **Step 4: Run** `node --test` (PASS); browser check: `--eval` that clicks the colour-blind button, then a second run with a fresh load: board and HUD icons in the new colours.
- [ ] **Step 5: Commit** `feat: colour-blind palette setting`.

### Task 7: Link preview card

**Files:**
- Create: `tools/og.html`
- Modify: `icons/og.png`

- [ ] **Step 1: Build `tools/og.html`**: a 1200 x 630 page using `../art/lock-closed.webp` (left half, cropped to the lock), a black terminal panel on the right with `OVERRIDE` in Share Tech Mono (`../fonts/`), the line "Ad-free match-3. Jack in, crack the lock.", a row of glowing tile characters in the standard palette and `PWNED` block letters drawn on a canvas as in the win art.
- [ ] **Step 2: Render** with `node tools/shot.mjs "http://localhost:8081/tools/og.html" icons/og.png --size 1200x630` using DPR 1 (add a `--dpr` option to `tools/shot.mjs` if needed). Expected: 1200 x 630 PNG, under 300 KB, text crisp.
- [ ] **Step 3: Commit** `feat: link preview card in the new look`.

### Task 8: Docs

**Files:**
- Modify: `CLAUDE.md`, `README.md`, `ROADMAP.md`

- [ ] **Step 1: Update** `CLAUDE.md`: Files (art/, palette.js, tools/shot.mjs, tools/og.html, docs/art.md), the Look bullet (glyph tiles, specials, blockers, effects, windows, dark only), keys (`override-palette`, no `override-theme`), `CACHE` `override-3`, browser checks via `tools/shot.mjs`. `README.md`: one line on the look if the README describes it. `ROADMAP.md`: mark the visual pass done; add "Sticker collecting" (one sticker per corporation hacked, a sticker wall) and "More obstacle plates" (camera hub, server rack, card reader; see `docs/art.md`); remove the cramped-worm and tall-phone polish items if fixed.
- [ ] **Step 2: Run** `node --test` (PASS) and `grep -c "—" CLAUDE.md README.md ROADMAP.md` (all 0).
- [ ] **Step 3: Commit** `docs: describe the new look`.
