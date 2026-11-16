# Board shapes, second pass: non-square boards

Date: 2026-11-16. Follows `2026-11-16-board-designs.md` (the second library, all square) and the board-shapes spec
(`docs/superpowers/specs/2026-11-16-board-shapes-design.md`), which lets a board be 5 to 9 wide and 5 to 11 tall.
This pass drew non-square candidates for `src/layouts.js` and put the ones that pass `check` and balance into
the game as the third library.

## What was looked at

- Three research agents looked at 120 saved images. Most were Override’s own screens (levels at 402 x 706,
  375 x 548 and 412 x 820, to see how tall and wide boards sit in the deck), plus contact sheets of
  Homescapes, Royal Match, Candy Crush Soda Saga, Toon Blast, Gardenscapes, Fishdom, Bejeweled and Cookie Jam
  boards, and about 25 new web images (Homescapes and Gardenscapes boards on ArtStation, Candy Crush fan and
  Soda levels from Bing image search).
- Patterns taken from them: towers (narrow and tall, chamfered or stepped), wide low bands with notches,
  lanes (two or three columns of cells split by hole columns, joined at the top or the bottom), letters
  (H, E, C, Z, U, a boot), offset rooms and islands joined by spawners or teleporters, castles and crowns,
  and drop boards with a row of drop points under lanes or a funnel.
- Nothing is copied from any one level: every candidate is generic geometry redrawn for our rules
  (top left anchor, gravity down, holes, blocks, spawners, teleporters, drop points).

## Candidates

130 candidates in three parts: part a 40, part b 41, part c 49. All were drawn as unpadded w x h rows with
effort 1 and a rough band.

Sorting them out:

- Too wide: the cell size cap gives `MAX_W` 9 (10 columns would make cells under 30 px on 375 x 548).
  Nine candidates were 11 wide. Redrawn 9 wide: pipes (lanes 2, 3, 2), viaduct, gallery, piers and comb from
  part b (now fangs). Dropped: ribbon from part a (9 wide it is band or ribbon from part b again), aisle (9 wide
  it is the redrawn pipes), switchback and tramline (three 3-wide lanes need 11 columns; 2-wide lanes make the
  snake cramped, and switchback was already dropped from the second library).
- Same shape twice (keep the better one): boot from part b and sock (both the boot from part a), aitch from
  part b (aitch from part a), dock (annex with spawners), kite from part b (kite from part a), well from part b
  and shaft (well from part a), gutter (spillway).
- Name clashes between parts were renamed: spire (b) to steeple, anvil (b) to pedestal, annex (b) to loft,
  rooms (b) to wards, cascade (a) to weir, shelves (a) to bookcase. Names of the earlier libraries and of
  their dropped boards (switchback, fountain, stagger, heist) were not reused.
- Every remaining candidate passed `check`, unmirrored and mirrored.

## Tuning

A harness forced each candidate onto up to seven levels inside its band (levels 11 to 150, teleporter
boards from 16, drop boards from 21) and ran `prepare` there: need against the target 8 + 14 d, prepare time
and whether the level fell back. Effort was set to about effort x 90 / average ratio, over four rounds, and
the result checked with `node tools/sim.mjs 1-150`.

Teleporter boards without spawners got their top row marked `S` (same cells spawn; the library convention).

Drop boards with few drop points were slow to prepare (the bot leaves drops stuck on bottom cells that are not
drop points). More drop points fixed them: basin (3 instead of 2), sump (4 instead of 3), temple (5 instead
of 4), waist (4 instead of 3), rake (5 instead of 3), well (4 instead of 3), and scree from the second library
(3 instead of 2; it took 3 to 4 s before). dumbwaiter, a 5-wide drop tower, played at 158 % with two drop
kinds, so its band ends at 0.65 (two kinds start at 0.7). delta from the second library took up to 11 s on
level 28 (d 0.8; cascades through its teleporters): its band now ends at 0.65. comb (drops under 1-wide
teeth) played at 168 % on level 58 with two drop kinds: its teeth are one row shorter and its band ends at 0.65
too; it stays the hardest new board (about 120 % in the harness at effort 0.2).

## Which went in

112 boards, 70 taller than wide and 36 wider than tall (the rest are 9 x 9 island boards).

- Shapes and walled boards (81): spire, band, chimney, rooms, keep, moat, stairwell, boot, aitch, ewe, needle,
  pagoda, pistons, kite, bookcase, anvil, strata, cee, casement, tiara, hexnut, landslide, sidecar, zed, nave,
  postbox, steeple, obelisk, lighthouse, twintower, bumps, cactus, ribbon, shelves, chevron, crown, stairs,
  bridge, horseshoe, pedestal, fork, castle, wards, pools, lagoon, catwalk, quads, cellar, post, mast, ribs,
  lozenge, corset, pine, stupa, icicle, clover, totem, studs, flue, plinth, girder, magnet, shelf, dome, cleft,
  visor, arcade, ledger, tines, bays, horns, creek, twins, bunks, skyline, quarters, apart, pipes, fangs,
  gallery.
- Teleporter boards (15): annex, elevator, siphon, stack, elbow, loft, mezzanine, ferry, track, shuttle,
  transfer, vaults, decks, viaduct, piers.
- Drop boards (16): comb, trough, rake, well, dumbwaiter, cargo, spillway, wells, waist, cascade, gutters,
  sump, basin, cisterns, canal, temple.

The new tags `tall`, `wide`, `lanes` and `island` are descriptive only; `SPIKE_TAGS` is unchanged.

## Which were dropped after tuning

- stilts, weir, sieve, prongs: still 150 to 200 % of the target after two tuning rounds, at effort 0.2 to
  0.3 (stilts and sieve: drops on a wide low board with pegs; weir: two stages joined by teleporters; prongs:
  drops under three 2-wide lanes). bays keeps the prongs shape without drops.
- organ: 1-wide lanes on both sides (tiles there only match vertically), up to 8 s to prepare; the redrawn
  pipes covers lanes.
- harbor: annex with a loop through a teleporter from the bottom left; need swung from 25 % to 270 % of the
  target between levels. annex and cargo keep the shape.

## Result

`node tools/sim.mjs 1-150` after the library: median ratio 95 % (before: 100 %), no fallbacks, prepare median
about 0.4 s, at most 2.1 s (levels 1 to 60: at most 2.0 s; levels 26, 54 and 58 took 2 to 2.7 s before).
Levels 1 to 150 meet 74 of the 153 templates; the rest were checked with the harness only. Single levels still
run over 150 % on their own deal (cisterns 310 % on level 119, tines 200 %, sump 173 %) while the same
templates average 90 to 100 % over seven levels in the harness.
