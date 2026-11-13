# Art

How Override's images in `art/` were made, and how to make more that match. Everything drawn on
the board (tiles, specials, blockers, effects, the win art) is code in `src/ui.js`; only the
hardware and the world around it are images.

## Rules

- Gritty 2080s street level, Shadowrun-style: worn, scuffed, rainy, sodium orange and teal light.
  Light wear on the deck (scuffs, scratches), no rust, little or no tape, no screws.
- No real brands or logos, no biohazard or radiation signs. Fictional corporation names come from
  Splice's name generator (`src/hosts.js` in Splice).
- Every obstacle has two plates with the same framing: locked, and open (made as an edit of the
  locked one, so only the state changes).
- Plates are close-ups at touching distance on a solid wall: no doors, no openings, nothing that
  reads as already open.
- Stickers: generate four per image, each with its own shape, material, colours and type. Sheets
  of many uniform stickers came out boring.
- Assets that the game places (deck frame, plug, keys, stickers) are generated front-on on a
  plain flat black background, then cut out.

## Tools

- **Gemini app** (gemini.google.com, "Create image"): about 12 free images a day, 1024 px on the
  long side.
- **Google AI Studio** with the Nano Banana Lite model (`gemini-3.1-flash-lite-image`): sharper
  (768 x 1376 or 1599 x 656), takes an attached image as a reference or for edits. Adds a small
  sparkle watermark in the bottom-right corner; paint it out before cutting.
- Both were driven from Claude Code with the Playwright browser while the owner was logged in.
  The image is read off the page with a canvas `toDataURL` (the app's blob URLs refuse `fetch`).

## Cutting out

Pillow, in a throwaway script:

1. Make near-black pixels transparent where they connect to the image border (flood fill on a
   brightness mask, threshold about 20 to 28), then also fill enclosed dark holes (the inside of
   the cable loop), blur the alpha by about 0.7 px.
2. Crop: the deck frame is cropped to its metal (no transparent margin); stickers are cropped
   above any caption text the model adds.
3. Save as WebP (quality 82 to 90). The plates are 1024 x 420.

The deck frame's `border-image` slices (188 128 189 128) are measured on the cropped frame:
top bezel down to the screen, side rails, bottom bezel.

## Prompts that made the current art

Shared style block, put in front of scene prompts:

> Gritty Shadowrun-style cyberpunk, 2080s street level, not clean sci-fi. Night, heavy rain,
> sodium-vapour orange streetlight mixed with cold blue-green monitor glow. Worn, dirty,
> improvised hardware: scratched gunmetal, chipped paint, duct tape, stickers, grime, rust
> streaks, cable clutter, water droplets. Photoreal with a painted concept-art finish, high
> contrast, crushed blacks, film grain.

(The deck later dropped the rust and tape: see its prompts.)

**Maglock plate, locked** (Gemini app, after an alley background in the same chat):

> Redo the close-up strip of the maglock: same camera distance, framing, lighting, rain and
> style, aspect 2.4:1. But the lock is mounted on a solid, continuous wall of grimy concrete and
> corrugated metal: no door, no door frame, no hinge, no gap or opening anywhere in the frame, so
> nothing looks open. Red LCD reads LOCKED, red LED. A thick cable is plugged into a port on the
> underside of the lock and runs straight down out of the bottom edge of the frame.

followed by:

> The wall must fill the entire frame from the left edge to the right edge: grimy concrete in the
> middle, corrugated metal panels and pipes to the sides, no wall edge, no corner, no sky, no open
> space anywhere. Keep the teal light only as a coloured glow falling on the wall from the left.
> Everything else the same.

**Maglock plate, open** (AI Studio, locked plate attached):

> Edit the attached image only, keep everything else exactly the same (camera, framing, wall,
> pipes, lamp, lighting, rain, cable, aspect 2.4:1): the maglock has been hacked. The LCD now
> reads OPEN in green, the LED is green, a few small sparks and a thin wisp of smoke come from the
> cable port under the lock.

**Deck** (AI Studio, an earlier deck attached as reference, then edited twice):

> Redesign the attached rugged hacking deck, keeping its exact material, colour and wear (dark
> scuffed gunmetal, rubber corner bumpers, screws, light scratches, no rust). Portrait 9:16,
> front-on orthographic, plain flat pure black background. Changes: thin, even bezels on the left,
> right and bottom; the screen is a large flat pure black rectangle filling most of the front,
> straight edges, nothing on it. All controls move to the top bezel: a jack socket in the centre
> of the top edge with a braided cable plugged in that loops up and away, and two small chunky
> hardware buttons on the top bezel, one left and one right of the socket. No stickers, no text,
> no logos.

> Edit the attached deck, keep its exact material, colour, wear, top controls, cable and corner
> bumpers. Change only the proportions: the bottom bezel becomes as thin as the side bezels (just
> the rubber bumpers and a narrow strip of metal below the screen), and the screen grows downwards
> to fill the freed space. Bezels on left, right and bottom are thin and even. Portrait 9:16,
> front-on, plain flat pure black background, no text, no logos.

> Edit the attached deck only: remove every screw and screw hole from the front (top bezel, side
> rails, everywhere), leaving smooth scuffed gunmetal in their place. Keep everything else exactly
> the same.

The plug and the two keys are cut from the deck with screws (same geometry); the frame comes from
the screwless version with the plug and keys painted out.

**Street stickers** (Gemini app; skull, VOIDWALK, 42 and the eye came from this sheet):

> Now a sticker sheet for the same world, as a game asset. Square image, plain flat pure black
> background. Twelve separate die-cut stickers in a neat 4 by 3 grid with wide empty black space
> between them, none touching or overlapping, all upright and front-on, each with a thin white
> die-cut border. ... Four street stickers: a small skull, a graffiti tag "VOIDWALK", a "42", and a
> crude spray-stencil eye. No biohazard or radiation signs, no real-world brands.

**Corporation stickers** (for the roadmap's sticker collecting; the look the owner liked):

> Make a new sheet of only four corporate stickers, square image, plain flat black background,
> wide space between them, upright and front-on. Each one must differ in shape, material, colour
> scheme and typography, like real merch from very different companies:
> 1. "Mitsuda Telecom": round glossy white vinyl, minimal thin-line antenna mark, light
>    Japanese-style sans serif, a small kanji, one edge peeling.
> 2. "Ironveil Security": angular red and black shield-shaped crest with a stylised raptor, heavy
>    condensed military lettering, scratched.
> 3. "Kessler-Hayashi Holdings": embossed gold foil seal on deep navy, ornate serif monogram KH
>    with laurel, old-money luxury.
> 4. "Hexavon": translucent holographic rectangle, iridescent rainbow sheen, futuristic geometric
>    wordmark, a marker X scrawled across it.
> No uniform white borders, no captions under the stickers, no hazard symbols, no real-world
> brands.

## New obstacle plates

Use the maglock prompt with a different device ("a camera junction box", "a server rack panel",
"a card reader"), keep "same camera distance, framing, lighting, rain and style, aspect 2.4:1"
and attach the maglock plate as a style reference. Then make the open state as an edit of it.
