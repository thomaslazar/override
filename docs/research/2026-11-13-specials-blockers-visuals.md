# Specials and blockers: how commercial match-3 makes them read, and what to draw for Override

Date: 2026-11-13. Purpose: the owner finds our specials (same glyph plus small brackets or a scan line) and blockers (grey hex blocks, grey bars over a tile) too weak. This note records what shipping games do and turns it into concrete drawings for a dark neon hacker look.

## Method and honesty about sources

28 distinct images were viewed before the browser step (31 in total after it). They came from the App Store screenshot sets (fetched through the public iTunes lookup API) for Candy Crush Saga, Candy Crush Soda Saga, Royal Match (the set shows Royal Match and its sibling Royal Kingdom boards), Homescapes, Gardenscapes, Toon Blast, Match Masters and Madness Match, plus itch.io screenshots of the cyberpunk and neon projects Match Runner (deckarep.itch.io/match-runner), Cyberdeck Shuffle (ahmadgalea.itch.io/cyberdeck-shuffle) and a neon app, Neon Splash (App Store id 1473007377). The Fandom wikis (candycrush, candycrushsoda, royalmatch) sit behind a Cloudflare challenge and could not be downloaded, so their file pages were only seen as search snippets. The App Store screenshots for the Candy and Homescapes games are small (221 by 480), so fine detail is from memory of the games and from the wiki text returned by search, which is marked "per wiki text" below. Stated mechanics (striped = row or column clear, wrapped = 3x3 then bigger, colour bomb = clear a colour, Rocket plus TNT = three rows and columns, two Light Balls clear the board) are from the Candy Crush Soda wiki pages (candycrushsoda.fandom.com/wiki/Striped_Candy, /Color_Bomb) and Royal Match wiki (royalmatch.fandom.com/wiki/Rocket_Combinations) as surfaced by search. Later, the owner asked to use a real browser for blocked sites. The Candy Crush Saga wiki loaded in Playwright (candycrush.fandom.com/wiki/Special_Candy and /wiki/Blocker), but its image CDN still refused curl and the images in a full-page screenshot were lazy and did not render, so those three extra crops (31 images in total) only yielded text. From that text: the wiki lists striped, wrapped, colour bomb, jelly fish and coconut wheel as the special family; multilayered frosting has a maximum of 5 layers and is cleared through adjacent cleared candies; marmalade is a weak blocker that covers a candy; the liquorice lock stops a candy being switched and protects it from one hit, and locked blockers cannot be matched; liquorice swirls cannot be matched but are movable and fall with gravity; chocolate multiplies and replaces an adjacent candy if none are moved. This matches the "lock over a live tile" versus "occupies a cell" split used below. No cyberpunk match-3 with real specials and blockers was found at screenshot quality; the nearest is Match Runner, which has only plain tiles and a few dark "dead" tiles (seen in its screenshot).

## 1. Specials: how they differ from normal pieces

What the images show:

- Candy Crush Saga (App Store screenshots 1 to 6): normal candies are flat, glossy, single-colour shapes. A striped candy keeps the exact candy silhouette and colour and adds white diagonal stripes whose tilt points along the clear direction (visible on the red candies in the "Match Candy Combos" screenshot, and the giant red-and-white striped candy blasting a row). A colour bomb is a different silhouette (a round dark chocolate ball) with multicolour sprinkles, and it is colourless on purpose. Fish and lucky candies are separate objects again.
- Candy Crush Soda (screenshots 1 to 6): the wrapped candy is a rectangle in wrapper foil, clearly different from the round and oval normals. The big striped candy (white stripes on a tall shape) is nearly twice the width of its neighbours when it is a combo result.
- Royal Match (screenshots seen show the obstacle boards; booster art per wiki text): rocket is a cartoon rocket with the piece colour on its body and a direction implied by its nose, TNT is a dynamite bundle, the light ball is a round multi-coloured glowing orb. All three are bigger, more detailed and more saturated than the flat crown, shield and cube normals.
- Match Masters and Toon Blast (screenshots): the normals are simple icons on dark cells or flat cubes, so any special with extra detail already stands out.

Findings:

1. Most games use silhouette change for the colourless specials (colour bomb, light ball, TNT) and an overlay-on-same-silhouette for the colour-bound line special (striped candy). The overlay works only because it is large, high contrast and covers the whole piece, not a small badge. Our small brackets and thin scan line are far below that bar.
2. Colour-bound specials keep the piece colour (striped candy, Royal Match rocket body). Colourless ones are chocolate-brown or white or rainbow, and always include the full palette of the level somewhere (sprinkles, rainbow glow), which says "any colour" at a glance.
3. Size and glow: specials are drawn slightly larger (about 105 to 115 percent) and brighter than normals, and they idle with a pulse, a sparkle that travels over the surface, or a slow wobble. This is the main reason a player can find them at a glance in a full board. Specials also get a bright burst and a trail when they fire, which teaches what they do.
4. Direction on line clears: stripes tilted along the clear direction (Candy Crush), a rocket nose and fins pointing along the line (Royal Match), arrows on the piece (Toon Blast rockets). Two parallel arrows pointing both ways along the axis is the most common reading. Direction should be a large feature of the shape, never a thin detail.

## 2. Blockers

How "locked in place" is shown:

- Cage or chain over a live tile (Candy Crush locked licorice and chains in later episodes, Homescapes locks, Royal Match chains): the tile underneath stays visible and in its own colour, the cage is drawn on top with a dark outline and a warm metal colour (grey, gold, brown) that is a different hue family from the candies. This design is the same family as our firewall; its strength is that the player can still see what colour is trapped.
- Replaced cell: licorice swirls and meringue/frosting in Candy Crush (screenshot "Puzzling Challenges" shows chocolate and frosted blocks filling cells; "Smash the Candies" shows black licorice swirls sitting in cells in place of candies), Royal Match boxes and safes (the screenshots show a wooden crate grid and a purple steel safe with a red-and-gold crank), Toon Blast cubes and the jelly. These occupy the cell, are drawn as a solid object that fills it edge to edge, and use a material and colour outside the tile palette (brown, cream, steel, wood).

How "hits left" is shown:

- Stacked layers: Candy Crush frosting is drawn as one, two, three, four or five layers of cream, each layer visibly lower and smaller. Fewer layers means a flatter, smaller object. (Per wiki text for frosting; the Soda screenshot shows single-layer frosting blocks.)
- Cracks and chips: Royal Match crates and safes show a broken corner or a cracked face after the first hit. Chocolate in Candy Crush shrinks as the pieces get broken.
- Numbers: countdown bombs show a number in a badge; some layered blockers in other games print the number of hits. Numbers are the clearest signal but are used for time or for many-layer blockers, not for one to three hits.
- Shrinking: the object gets smaller or loses a layer, so remaining health maps to remaining size.
- Royal Match crates in the screenshot show their layer count by a stack of smaller objects inside (two stacked blue pots per box), so the box shows health by content count.

Position relative to tiles: locks and chains go over the tile (the tile stays visible). Layered obstacles go in place of the tile and are drawn as part of the board background with a drop shadow so they feel physical. Wood, steel, cream, brown chocolate and gold are the common materials; these contrast with the bright, saturated, glossy candy palette by being matte, desaturated or metallic. In the Royal Match screenshot the purple steel safes have a bright gold border and a red centre hub, so the blocker is darker and warmer than the red, green, blue and gold normals but still carries one saturated accent to look valuable.

## 3. Readability rules and colourblind support

Rules inferred from the images:

1. Every item has its own silhouette first, colour second. Candy Crush, Royal Match and Toon Blast normals all differ in shape (crown, shield, leaf, heart), so colour is never the only cue. Our glyphs already do this.
2. A special must be visible in the 30 percent squint test: reduce the screenshot to a few pixels and the special is still the brightest, largest or oddest blob.
3. Blockers sit in a different value and hue band from tiles (dark and matte, or metal) so that "not a tile" is decided before the player reads detail. The grey bars over a tile failed this because grey is the neutral, low-energy colour in a dark UI and so looked like disabled UI, not an object.
4. Motion is a free cue: idle shimmer, a spinning ring, a pulse on specials, and no motion on blockers (blockers sit still, which also says "this will not move").
5. Contrast against the cell: in the dark games (Match Masters, Madness Match, Match Runner) the tile cell is a dark rounded square and each normal is a bright icon on it. Match Runner is the closest to our look. Its weakness is also visible in its screenshot: several tiles are dark grey with a white glyph and read as dead or disabled rather than special.

Colourblind support in these games: Candy Crush and Royal Match have no palette option; they rely on distinct shapes and on the fact that the colour bomb and the like are silhouette-distinct. Toon Blast and Homescapes follow the same approach. The accessibility industry practice (also followed by Candy Crush's shapes per colour) is shape-first, palette-second. Because Override already has seven glyphs per colour, shapes carry the load already.

## 4. Recommendations for Override

Look to hold: black screen, glowing glyph in an outlined rounded cell. Give specials a "rendered hardware" look (a lit object with an outline and fill, not just a lit glyph) and blockers a "dead tech" look (unlit, matte, hazard-marked), so the pair reads as lit versus unlit, exactly the contrast of bright candies versus matte crates. Rule: a special adds light, a blocker removes light.

### Worm (clears a row or column, keeps its colour)

Option A, data packet with arrow heads (recommended). The cell gets a filled capsule, about 90 percent of the cell long in the clear direction and 55 percent wide, rounded ends, filled with a dim version (about 25 percent opacity) of the tile colour, a full-brightness outline, and the tile's glyph cut out in the centre as now. On both ends of the long axis, a bright chevron arrow pointing outwards (">" shape, 3 px thick, glow). Idle animation: two bright dashes slide along the outline in the axis direction, repeating every second. On fire, the capsule streaks along the row with a trail of the tile colour. Direction is readable from the capsule shape and the chevrons alone.

Option B, caterpillar of segments. Draw 3 short rounded segments in a line along the axis (like a worm made of three beads), the middle one holding the glyph, the outer two smaller and in the tile colour, with a bright "head" dot at one end that blinks. Idle: the segments take turns brightening in a wave along the axis. Stronger "worm" metaphor but a smaller silhouette; use only if the capsule feels too much like a button.

### Logic bomb (3x3, keeps its colour)

Option A, chip with pins (recommended, extends what we have). A square die about 85 percent of the cell, fill at 30 percent tile colour, bright outline, with 3 short pins on every side (12 pins total) sticking out of the die, so the silhouette becomes a spiky square distinct from the round cell. The glyph sits in the centre cut out. Idle: the pins pulse in a ring pattern outward (clockwise) and a small red-white dot in one corner blinks as a fuse light at 1 Hz. On fire, a square shockwave expands over the 3x3 area.

Option B, bomb sphere with a countdown ring. A circle about 80 percent of the cell, filled solid with the tile colour at 40 percent, bright outline, a thick ring around it that is segmented (8 segments) and rotates slowly, plus a short fuse stub with a spark on top. The circle differs from a square cell and rounded glyph boxes. On fire, the segments fly outward as a 3x3 burst.

### Zero-day (colourless, clears one colour)

Option A, turning prism ring (recommended, extends what we have). A ring made of all the level's colours as arcs (one arc per colour in play), rotating at about 0.5 turns per second, thick (12 percent of the cell), with a white core that holds a bright "0" or skull-like glyph and a white glow that is brighter than any tile. The multicolour ring is the "colourless, any colour" signal, same logic as Candy Crush sprinkles and the Royal Match rainbow light ball. Idle: slow rotation plus a random sparkle every second. On fire, the ring snaps to the target colour, lines of that colour light up, then all clear.

Option B, glitched white tile. A tile drawn in pure white and light grey, with RGB split (red, green and blue copies of the glyph offset by 2 px and flickering), horizontal tear lines that jump every 200 ms, and a black-and-white checker corner. Colourless and very "hack", and different from every other tile because it is the only white one. Weaker than A on small screens because motion fine detail is lost, so give it a bold white outline.

### Encrypted cell (blocker, 1 to 3 hits, occupies the cell, no tile inside)

Option A, locked data block (recommended). The cell is filled with a solid dark navy-violet slab (matte, no glow) with a thin warm amber hazard border (amber is not used by tiles, or if it is, then use the colour the palette lacks) and a padlock icon in the middle. Hits left: shown as the padlock's number of shackle rings, or better as a stack of 1, 2 or 3 horizontal plates; each hit removes one plate and the slab gets visibly thinner (inner square shrinks), the last hit leaves a cracked single plate with the amber border flashing. Cracks as a diagonal glowing amber line appear on the final layer. Hit feedback: a spark burst, the plate pops off, the screen shakes a pixel. A small number (1 to 3) in the corner is allowed as a reading aid.

Option B, scrambled noise block. The cell is filled with a block of static (hash characters, "#%&@" in dim grey-blue at 40 percent) that jitters every 150 ms, clipped to a rounded square with a thick amber outline. Layers are shown by how much noise remains: 3 hits = dense noise with a thick double outline, 2 = medium with a single outline, 1 = sparse noise with a dashed outline. Each hit decrypts part of it into clear text for a moment before it clears. Reads as "encrypted" immediately but the jitter may be noisy next to tiles; prefer A if motion is a worry.

### Firewall (locks a tile in place, one hit frees it)

Option A, barrier grid over the tile (recommended). The tile underneath stays fully visible and in colour. Over it draw a diamond-lattice cage of 4 to 5 thick orange-red lines (hot, like a firewall, about 4 px, bright, with a glow), crossing the cell edge to edge and slightly past it, with a small warning triangle at the top-left. The red-orange hue sits outside the tile palette and says "danger, blocked". Idle: a heat shimmer, the lines flicker in brightness slightly, no movement of position. One hit: the cage lines snap, break into 4 pieces and fly off, and the tile flashes once.

Option B, flame brick border. A thick outlined frame around the cell (orange to red gradient, 6 px) with small flame flickers on its upper edge, and the tile inside dimmed to about 60 percent so it reads as locked. Reads as "firewall" literally, simple to draw with canvas gradients, but dimming the tile loses colour information, so only use it if the dimming stays above 70 percent.

Rule for both blockers: the encrypted cell is cool (violet, navy, amber accent) and matte, the firewall is hot (orange-red) and bright, so the two never get confused with each other or with the tile palette.

### Colourblind palette option

Keep the shapes as the primary signal (already seven glyphs). Add one setting in the existing Settings tab, "Colour palette: standard / high contrast", stored as an `override-` key. The alternative palette should use an Okabe-Ito based set (vermilion, orange, yellow, bluish green, sky blue, blue, reddish purple), which stays separable under deuteranopia, protanopia and tritanopia, and it should vary lightness between neighbours as well as hue (pair a dark blue with a light yellow, and so on), because lightness differences survive all colour vision types. Blockers and specials should not depend on the palette: the amber-violet encrypted block and orange-red firewall use shapes (padlock, lattice) so they survive. Do not recolour only; test with a colour vision simulator on screenshots of a full board.

## Short summary

Specials: big silhouette changes, brighter and larger than tiles, direction as large chevrons or tilted stripes, colourless ones carry all level colours. Blockers: matte and dark or metallic, outside the tile hue band, cage over tile for locks, filled cell for layered ones, hits left as plates, cracks or shrinking. Firewall and encrypted cell differ in temperature (hot versus cool).
