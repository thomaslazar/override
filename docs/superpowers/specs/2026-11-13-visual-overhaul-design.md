# Override visual overhaul: design

Date: 2026-11-13. Status: approved by the owner ("the design we did is the spec"). Settled in a
brainstorm with browser mockups and a throwaway test build (`spike/visual-overhaul`, played on
the owner's iPhone). Where this document and the core loop spec disagree on looks, this one wins.

## Intent

The placeholder look (beige deck, plain geometric tiles, light and dark themes) "annoys the owner
to hell". Override is set in Splice's gritty Shadowrun-style city: you are the crew's hacker,
standing at the obstacle with your field deck plugged into it. The game should look like that:
dark, rainy street hardware outside, a glowing hacker terminal inside, a bit script-kiddie and
fun. Rules, levels, balance and saves do not change.

## Goals

1. The screen reads as a place: a close-up of the obstacle you are hacking at the top, your
   rugged deck plugged into it below, its screen holding the game.
2. Tiles, specials and blockers that read instantly and fit the hacker theme.
3. Fits real phones: the board gets the full width on a 402 x 706 viewport (iPhone with Safari's
   bars) and stays playable at 375 x 548 (iPhone SE in Safari).
4. Colour-blind players get a palette setting.
5. Docs, PWA cache, deploy workflow and the link preview card follow the new look.

## Non-goals

- Collecting stickers (one per corporation hacked). Roadmap item.
- More obstacle types than the maglock. The plate system supports them; the art comes later
  (roadmap).
- Sound and music, new rules, score, the drop goal, board layouts.
- A light theme. Dark only.

## Anti-goals

- A board smaller than today's on the owner's phone.
- Specials or blockers that need a second look to tell apart from tiles.
- Art that stretches visibly (plug, keys, stickers, lock picture).
- Real brands or real-world hazard symbols in the art.

## Approaches

1. **Port the spike (chosen).** The spike already has the layout, drawing code, assets and phone
   fixes working in the real game. Port it onto `master` in reviewed steps, clean it up, add the
   pieces the spike skipped (palette setting, effects, docs, PWA, preview card). Cheapest, and it
   keeps exactly what the owner played and approved.
2. **Rebuild from scratch against this document.** Cleaner history, but redoes solved layout work
   and risks drifting from what was approved.
3. **Draw everything in code (no images).** No generated art to maintain, but the owner judged
   code-drawn hardware too clean; the generated plates and deck are what made it gritty.

## The screen, top to bottom

**Strip** (`#strip`): a close-up photo-style plate of the obstacle device on a solid wall (no
doors or openings), camera close enough to touch it. Height `clamp(110px, 22dvh, 200px)`. The
plate is shifted down under the comms band and fades into the background at its bottom. Each
obstacle type has two plates, locked and open; on a win the strip switches to the open plate
(maglock: red LOCKED becomes green OPEN with sparks and smoke at the cable port). This build
ships the maglock only.

**Comms** (`#comms`): the decker in your earpiece, a dark translucent band at the top of the
strip (inside the safe area), amber DECKER label and one line. Stays a strip, not a screen line.

**Deck** (`#deck`): dark gunmetal with light scuffs, rubber corner bumpers, no screws, no rust.
Built from pieces so it fits every phone:
- the frame is one image used as a CSS `border-image` (corners fixed, plain edges stretched),
  cropped to the metal so no transparent margin wastes height;
- the plug with its looping braided cable (inside of the loop transparent) and the two hardware
  keys on the top edge are separate images that never stretch; the keys are decoration only;
- stickers are separate images placed relative to the bezel strips, slightly crooked as if stuck
  on by hand: a spray-stencil eye centred on the top bezel ("looking at you"), a skull near the
  bottom-left bumper, the VOIDWALK tag next to it, "42" on the right. Fixed decoration this build.

**Deck screen** (`#screen`), black with faint scanlines:
- **log**: terminal lines in green mono, `> FD-7 field deck Chapter 1 · Level 6`,
  `> handshake ok · cipher weak`, `> injecting payload_` (blinking cursor). The middle line hides
  below 780px viewport height, the whole log below 620px.
- **HUD**: goal icons with counts on the left (a tile character, a mini encrypted cell, a mini
  firewall), `PATROL IN` and the move count in amber on one line on the right; amber turns orange
  when moves run low and red at 3 or fewer (as today).
- **board**: the canvas, as large as the space allows (width-limited on most phones).
- **soft keys**: terminal-style keys in the bottom row, `[ Menu ]` now; room for more later
  (gear, hints). "Prototype, work in progress" sits small on the right.

## Board look

Cells are faint rounded squares on the black screen.

**Tiles**: one glowing character per glyph slot, in its colour with a glow:
`ｱ ﾊ ｦ 7 Ξ ﾐ Z` on `--t0 .. --t6` (`#3dff8a #35c2d9 #ff4fa3 #f2c230 #a77cf0 #ff6a2b #e9f0ff`).
Characters use the terminal font, falling back to the phone's own CJK font for katakana.

**Specials** (dedicated items in their tile's colour, brighter and larger than tiles; "specials
add light"):
- **Worm**: a data-packet capsule along the line it clears (row or column), dim fill in the tile
  colour, bright outline, chevrons pointing out at both ends, two white dashes running along it,
  the tile's character small in the middle.
- **Logic bomb**: a chip with 12 pins (3 per side) that light up white in turn, dim fill, bright
  outline, a blinking red fuse light in a corner, the character small in the middle.
- **Zero-day**: a ring of arcs in the level's colours turning slowly around a white core with a
  black `0`.

**Blockers** ("blockers remove light"):
- **Encrypted cell**: a dark slab filled with jittering grey static characters (`#%&@$?!*`), more
  static the more hits are left; an amber outline shows hits left: double at 3, single at 2,
  dashed at 1.
- **Firewall**: a flame frame (yellow to red gradient with small flickering flames on top) plus
  three thin hot vertical cage bars over the tile; the tile underneath stays at full colour.

**Selection**: a light outline on the selected cell (as today).

**Effects** (replacing today's flat flashes): cleared tiles pop and fade as today; a fired worm
streaks a glowing line of its colour along its row or column; a bomb sends a square shockwave
over its area; combos and the zero-day flash their area in white-green; encrypted-cell hits flash
amber. `prefers-reduced-motion` turns off idle animation (dashes, pins, ring, static, flames) and
effects, as today.

## Windows

All sheets, the menu, the loading card and the toast become terminal windows on black: green mono
text, a thin green border with a soft glow, titles prefixed `> `, keys drawn as `[ Label ]`.

**Win window**: above the title, an ASCII padlock that toggles between locked and open (shackle
lifted, right leg out, `*` in the keyhole); both frames have the same body size, the shackle and
the keyhole centred, the padlock drawn as one left-aligned block centred in the window. Below
it, `PWNED` in block letters drawn as pixels on a canvas (fonts differ in block glyph widths),
each row cycling through the tile colours, with an occasional glitch. Then `> Door’s open`, the
moves to spare, and `[ Next level ]`. Comfortable spacing between padlock, PWNED and the text.
The art is decoration, not text: no translation. Reduced motion shows the open frame, no cycling.

The menu keeps its tabs (Run, Settings, Info). Settings loses the theme switch and gains the
palette switch.

## Colour-blind palette

Settings: "Colours: standard / colour-blind", stored as `override-palette`. The colour-blind set
is Okabe-Ito based with a spread in lightness, applied to the seven tile colours only (blockers
and specials keep their own look): `#56b4e9 #e69f00 #f0e442 #009e73 #0072b2 #d55e00 #cc79a7`,
ordered so neighbouring glyph slots differ in lightness. Characters already differ per colour,
so colour is never the only cue.

## Assets

- `art/`: WebP images: `lock-closed.webp`, `lock-open.webp` (1024 x 420), `deck.webp` (frame,
  768 x 1160, border-image slices 188 128 189 128), `plug.webp`, `key-l.webp`, `key-r.webp`,
  `sticker-eye.webp`, `sticker-skull.webp`, `sticker-voidwalk.webp`, `sticker-42.webp`. About
  250 KB in total. All are on `spike/visual-overhaul` and are taken from there as they are.
- `fonts/share-tech-mono-latin-400.woff2` (SIL OFL), credited next to Barlow.
- The art was generated with Gemini (Nano Banana) and cut out by script (near-black background
  made transparent by flood fill, enclosed holes too). `docs/art.md` records the prompts, the
  workflow (Gemini app or AI Studio driven in a browser, about 12 free images a day in the app),
  the cut-out steps and the rules (shared style block, one locked and one open plate per
  obstacle with the same framing, no real brands, no hazard symbols, stickers four per image with
  their own art direction).

## Layout numbers (from the phone tests)

- Deck border widths `47px 30px 47px 30px`; plug `top:-95px; width:64px` centred; keys
  `top:-56px; width:30px`, 58px in from each side; stickers positioned relative to the deck's
  padding box (top bezel at negative `top`, bottom bezel at `top: calc(100% + Npx)`).
- `#deckwrap` overlaps the strip by 26px so the plug sits under the lock.
- Board sizing stays as today (`fit()` on a `ResizeObserver`).

## Architecture and files

No rule, level, bot or save changes. `src/core.js`, `src/levels.js`, `src/bot.js`,
`src/worker.js` untouched.
- `index.html`: new body structure (strip, comms, deck with images and stickers, screen with log,
  HUD, board, soft keys); rain canvas removed.
- `style.css`: dark tokens only on `:root`, terminal windows, deck pieces, small-screen rules.
- `src/ui.js`: drawing section rewritten (glyph tiles, specials, blockers, effects), win art,
  palette setting, theme code removed, rain code removed.
- `lang/en.json`: theme keys removed; log lines, palette labels added.
- `sw.js`: `SHELL` adds the art and the new font, `CACHE` becomes `override-3`.
- `.github/workflows/pages.yml`: copy `art` too.
- `icons/og.png`: new link preview card in the new look (1200 x 630).
- `CLAUDE.md`, `README.md`, `ROADMAP.md` (sticker collecting and more obstacle plates added,
  visual pass marked done), `docs/art.md` new.

## Testing

- `node --test` stays green; the lang test keeps "UI uses exactly the keys in en.json".
- A test that every file in `art/` and `fonts/` is in `SHELL` and that the workflow copies `art`.
- Browser checks in headless Chromium (real time, no virtual time budget) at 402 x 706,
  375 x 548 and 412 x 820: board size, nothing overlapping (comms over the LOCKED display, plug
  on the deck's top edge, stickers on the metal), win window and menu fit. Inspect enlarged crops,
  not only full screenshots.

## Builder notes (settled after a builder check, the owner was away)

- **Art prompts**: `docs/art.md` is written from the brainstorm session's actual prompts (part of
  this work, not invented).
- **Link preview card**: `tools/og.html`, a 1200 x 630 page composed from `art/` files (the
  lock plate on the left, the deck screen with a few glowing tiles and the `PWNED` block letters
  on the right, `OVERRIDE` in the terminal font), rendered to `icons/og.png` with headless
  Chromium. No new generated art.
- **Effects, concretely**: keep today's timing (flash 320 ms, pop 240 ms, linear fade). Worm:
  a glowing bar 0.35 cells thick in the worm's tile colour along its whole row or column.
  Bomb: a square outline growing from 1 to 3 cells (5 for `bb`) around the bomb, line width 0.12
  cells, white-green. Combos `ww`, `bw`, `zz` and the zero-day: their area filled white-green at
  35 % alpha, fading. Encrypted-cell hit: an amber outline growing slightly, fading. Done when
  code-reviewed and seen in a browser check; the owner tunes by playtest.
- **Strip state**: `begin` and `start` show the locked plate; `win` (also on a reloaded won
  state) shows the open plate. Restart level goes back to locked.
- **Old theme key**: `override-theme` is ignored, not deleted. `theme-color` stays `#0b0c0e`.
  The landscape "turn your phone" overlay is restyled as a terminal line.
- **Same-origin siblings**: nothing to do; `CACHE` `override-3` and the `override-` prefix cover it.

## Open (decided later)

- More obstacle plates (camera hub, server rack, card reader, ...), from the roadmap.
- Sticker collecting.
