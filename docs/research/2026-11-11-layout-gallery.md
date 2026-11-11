# Match-3 layout gallery

Date: 2026-11-11. Companion to `2026-11-11-level-layouts.md`. Feeds the layout template library for Override.

## Method and honesty note

I viewed screenshots of 50 Candy Crush Saga levels (49 boards and one goals card, level 126) from candycrush-cheats.com, whose level pages follow `https://www.candycrush-cheats.com/level/<N>`. Fandom wikis return 403 to our fetcher; the Candy Crush Soda, Royal Match, Homescapes and Gardenscapes guides I tried gave no usable board images, so everything here is original Candy Crush Saga. The screenshots are small (about 250 to 450 px wide), often cropped, and annotated with arrows and circles, so the grids are approximate: shapes and block positions are right to within a cell, and blocker types are collapsed to two classes. Portals are drawn as faint pink and blue marks that did not survive the resolution; I only mark portals where the guide text or the shape makes them certain (levels 70, 76, 137, 201), and even then the exact cells are my guess. Treat every transcription as "inspired by".

Legend, used throughout:

- `.` void (no cell), `#` playable cell, `B` blocker that needs specials or several hits (licorice, locks, chocolate), `b` light blocker (one or two hits: frosting, ice), `S` spawn point inside the board (top-row playable cells spawn anyway), `D` drop (ingredient) start, `E` exit for drops, `=` conveyor cell.
- Lowercase letters other than `b` are portal cells (playable). Each letter appears twice: once as an ingress (tiles falling off the bottom of that cell enter) and once as an egress (tiles come out at the top of that cell). The legend under each grid says which is which, with (row, column) counted from 0 at the top left.
- Gallery grids keep the real board size (rows by columns) and are not always square. Template grids at the end are 7x7 to 9x9 square.

## Archetypes

### Open shape (baseline)

Levels 22, 95, 148 and 610 are plain 9x9 boards with an ingredient (cherries) near the top, exit along the bottom. Level 83 is 9x8 open with two locks in the bottom corners. Level 46 is 9x8 open with a small locked-and-frosted core. These are the early levels that teach the goal and nothing else. Difficulty lever: only move count and colour count.

### Frame and ring

Level 280 (https://www.candycrush-cheats.com/level/280), 9 wide, 7 tall, chamfered corners:

```
.B#####B.
B#######B
b#######b
b#######b
b#######b
B#######B
.B#####B.
```

A ring of locked boxes around an open middle. Interesting: the goal tiles are the rim, so the player works from the inside out. Lever: rim hit count.

Level 223 (https://www.candycrush-cheats.com/level/223), 9x9, side walls of frosting and licorice two cells deep:

```
bB#####Bb
bB#####Bb
BB#####BB
bB#####Bb
bB#####Bb
bB#####Bb
BB#####BB
bB#####Bb
bB#####Bb
```

A 5-wide open lane that is also the only way to reach the walls. Lever: special-only blockers (licorice) force striped or wrapped candies.

### Hourglass, funnel and bay

Level 137 (https://www.candycrush-cheats.com/level/137), rounded diamond (approximate), portals in the middle section:

```
...###...
..#####..
.#######.
#########
#########
.#######.
..#####..
...###...
```

Interesting: no flat top, so most cells depend on diagonal fill; the guide notes long portal routes on this level. Lever: the narrow bottom.

Level 480 (https://www.candycrush-cheats.com/level/480), 9x9, top 6 rows open, bottom three rows a 3-wide bay between licorice blocks:

```
#########
#########
#########
#########
#########
#########
BB.###.BB
BB.###.BB
BB.###.BB
```

A funnel with decorative sides. Interesting: everything must pass a 3-wide neck, and a drop exit placed in the bay makes a classic race. Lever: neck width.

Level 1100 (https://www.candycrush-cheats.com/level/1100), heart or bowl, tapering to a point (approximate):

```
..#####..
.#######.
#########
#########
#########
.#######.
..#####..
...###...
....#....
```

Lever: the number of moves wasted on the shrinking tip.

### Split halves

Level 16 (https://www.candycrush-cheats.com/level/16), two 4x9 columns with a one-cell gap, early tutorial for the idea that regions are separate:

```
####.####
####.####
####.####
####.####
####.####
####.####
####.####
####.####
####.####
```

Level 70 (https://www.candycrush-cheats.com/level/70), 9 wide, 8 tall. The text guide says the halves are linked by portals at the bottom of the left side. Right half bottom is a locked and frosted shelf:

```
####.####
####.####
####.####
####.####
####.BBBB
####.bbbb
####.BBBB
####.BBBB
```

Legend: guess only, left bottom row feeds right top via portals. Interesting: the right half stays small and blocked, so progress goes through the left. Lever: which half holds the goal.

Level 262 (https://www.candycrush-cheats.com/level/262), left 4 wide with licorice and frosting corners, a gingerbread wall column, right 4 wide open:

```
####.####
bbb#.####
b###.####
####.####
####.####
####.####
####.####
BB##.####
BB##.####
```

Level 460 (https://www.candycrush-cheats.com/level/460), asymmetric: left 5 wide open, right 3 wide with a frosting then box stack:

```
#####.###
#####.###
#####.###
#####.###
#####.bbb
#####.bbb
#####.BBB
#####.BBB
#####.BBB
```

Interesting: the narrow side is a vault, the wide side is the playground. Level 388 is a similar 4 and 5 split with a decorative divider and a small portal-like gap; not transcribed.

### Islands

Level 31 (https://www.candycrush-cheats.com/level/31), very early. Floating 1x2 islands above a base. Each island is only two cells tall, so it is solved by dropping candies in through a gap rather than by matching inside:

```
.#.#.#.#.
.#.#.#.#.
.........
..#.#.#..
..#.#.#..
.........
#########
#########
#########
```

Level 76 (https://www.candycrush-cheats.com/level/76), four islands: 4x4 top-left holding the cherries, 4x4 bottom-left, and a 4x9 right column; ingredient exit is the top-left, so the route runs through portals and loops "upwards" on screen. The guide says this level reverses direction:

```
####.####
####.####
####.####
####.####
.....####
####.####
####.####
####.####
####.####
```

Legend: portals not visible; one pair links the bottom of the top-left island to the top of the bottom-left island, one more joins the lower left to the right column. Lever: ingredient route length.

Level 201 (https://www.candycrush-cheats.com/level/201), 9 wide, open top six rows, three bays below (left 2 wide, middle 3, right 2), portal entrances at the top of each bay:

```
#########
#########
#########
#########
#########
#########
##.###.##
##.###.##
```

Interesting: bays are disconnected and each is fed through a portal. Lever: three small 2x2 or 3x2 regions are hard to match in, so special candies carry the level.

Level 700 (https://www.candycrush-cheats.com/level/700): a narrow left column of locks and frosting beside a seven-wide board whose bottom corners hold portal cells. Not transcribed.

### Walled vault

Level 100 (https://www.candycrush-cheats.com/level/100), 9x9, a frosting roof with a soft pocket beneath it. Roof shown, pocket simplified to open cells:

```
#########
#########
##bbbb###
#bbbbbb##
##.....##
#########
#########
#########
#########
```

In the screenshot the pocket cells are soft ice that needs one hit each. Lever: the roof means the pocket is reached only by line clears or by cracking the roof.

Level 505 (https://www.candycrush-cheats.com/level/505), two cake bombs (2x2 blocks) inside a frosting frame, bottom licorice row with a single gap:

```
#########
#########
#########
#########
#bbbbbbb#
#bBBbBBb#
#bBBbBBb#
#bbbbbbb#
BBBB#BBBB
```

Interesting: the one gap in the bottom is the exit for drops or the entry for fall-through. Lever: two vaults to open, not one.

Level 366 (https://www.candycrush-cheats.com/level/366): open 9x9 with two 2x2 cake bombs in rows 2 and 3 and a small box cluster near the bottom:

```
#########
#########
#BB###BB#
#BB###BB#
#########
#########
##b###b##
##bbbbb##
#########
```

Level 950 (https://www.candycrush-cheats.com/level/950): a left block of licorice holding two cake bombs, a frosting column, and a right strip with locks at the bottom. Not transcribed.

Level 115 (https://www.candycrush-cheats.com/level/115), 9x9, a locked block top centre and a boxed stack top right:

```
##BBBB###
##BBBB###
##BBBB###
##BBBB###
##bbbbbb#
#########
#########
#########
#########
```

### Dig-out, shelves and bottom vaults

Level 305 (https://www.candycrush-cheats.com/level/305), 9x9, four open rows, two frosting rows, then boxes with a pocket:

```
#########
#########
#########
#########
bbbbbbbbb
bbbbbbbbb
BBB###BBB
bb#####bb
B#######B
```

Level 188 (https://www.candycrush-cheats.com/level/188), 9x9, crenellated top, five open rows, then a frosting row, a chocolate row, and two rows where candies sit between frosting:

```
#.#.#.#.#
#########
#########
#########
#########
bbbbbbbbb
BBBBBBBBB
b#b#b#b#b
b#b#b#b#b
```

Interesting: the ingredient has to cross two full-width shelves, so the player must open a slot; level 241 does the same with a double shelf of frosting and box rows. Lever: hits per shelf.

Level 342 (https://www.candycrush-cheats.com/level/342), 9x9, locked boxes in the bottom three rows with alternating gaps:

```
#########
#########
#########
#########
#########
#########
#b#b#b#b#
bBbBbBbBb
B.B.B.B.B
```

Level 435 (https://www.candycrush-cheats.com/level/435), 9x9, a full-width vault filling the bottom five rows (locks, then licorice), the only way down is breaking through:

```
#########
#########
#########
#########
bbbbbbbbb
bbbbbbbbb
BBBBBBBBB
BBBBBBBBB
bbbbbbbbb
```

Level 730 (https://www.candycrush-cheats.com/level/730), 9x9, a lock column down the middle and a chocolate staircase at the bottom:

```
####B####
####B####
####B####
####B####
####B####
####B####
###BB####
##BBBBB##
BBBBBBBBB
```

Level 555 (https://www.candycrush-cheats.com/level/555), 9x9, the whole interior is licorice and locks; only the top row and the left two columns are free, with bombs ringing the free lane. New archetype: L-lane dig-out.

```
#########
##BBBBBBB
##BBBBBBB
##BBBBBBB
##BBBBBBB
##BBBBBBB
##BBBBBBB
##BBBBBBB
##BBBBBBB
```

### Drop race with far exits

Level 160 (https://www.candycrush-cheats.com/level/160), 9x9, licorice columns on both edges and a chocolate floor; cherries start at the top, the exit is through the floor:

```
B#######B
B#######B
B#######B
B#######B
B#######B
B#######B
B#######B
B#######B
BBBBBBBBB
```

Level 76 and level 137 (above) are the portal ingredient levels. Level 22 and 148 are the plain version.

### Pillars and lanes

Level 900 (https://www.candycrush-cheats.com/level/900), 9x9, three licorice pillars (columns 0, 4 and 8) from row 3 down, an open three-row roof above:

```
#########
#########
#########
B###B###B
B###B###B
B###B###B
B###B###B
B###B###B
B###B###B
```

Interesting: three 3-wide wells separated by walls, easy to see, and every well is fed from the roof. New archetype: pillars. Level 760 (https://www.candycrush-cheats.com/level/760) is the edge version, box columns on both sides and a few frosting cells in the middle:

```
B#######B
B#######B
B#######B
B#######B
B#######B
B##b#b##B
B#######B
B#######B
B#######B
```

### Conveyor cross

Level 580 (https://www.candycrush-cheats.com/level/580), 9x9, a horizontal and a vertical conveyor crossing at a lock in the centre, four frosting quadrants:

```
####=####
#bbb=bbb#
#bbb=bbb#
#bbb=bbb#
=========
#bbb=bbb#
#bbb=bbb#
#bbb=bbb#
####=####
```

Interesting: conveyors move tiles one step per move, so the player cannot ignore where the lane ends. New archetype: conveyor cross.

### Bite and notch

Level 800 (https://www.candycrush-cheats.com/level/800), 9x9 with a decorative bite out of the top left (approximate):

```
##..#####
#...#####
#...#####
#...#####
#########
#########
#########
#########
#########
```

Level 320 (https://www.candycrush-cheats.com/level/320), 9x8, a crenellated top (spawners only above every second cell) and rounded bottom corners:

```
.#.#.#.#.
#########
#########
#########
#########
#########
#########
.#######.
```

Level 850 is a bowl with a crenellated top and two decorative lower notches; level 530 has columns of unequal height at the top. Neither transcribed.

### Locked corners

Level 41 (https://www.candycrush-cheats.com/level/41), 9x9, locks in all four corners and a frosted 3x3 core:

```
B#######B
#########
##bbbbb##
##bBBBb##
##bBBBb##
##bBBBb##
##bbbbb##
#########
B#######B
```

Interesting: two goals at once, corner unlocks and a core to open. Level 58 is the same idea off-centre, chocolate and frosting as a block:

```
#########
#########
#########
###bbbb##
###bBBB##
###bbbB##
#########
#########
#########
```

Level 61 (https://www.candycrush-cheats.com/level/61), a mound of frosting and locks rising from the bottom:

```
#########
#########
#########
####bbb##
####bBb##
####bBb##
##bbbBbb#
##bBBBBBb
#bBBBBBBb
```

### Others viewed, no grid

Level 126 is only a goals card (collect 96, 49 and 21 tiles, plus two special candy orders). Level 174 has a top-left lock cluster and a chimney of locks down the middle. Level 241 has two full shelf rows at the bottom. Level 410 has a 3-wide chocolate block in the middle with lakes either side. Level 640 is a plain rounded 8x8. Level 670 has thin walls between cells, a kind of edge blocker not in Override: new archetype "edge walls". Level 1000 is open with a frosting S-shape low centre. Level 1200 is a 7 wide board with a rounded bottom and boxes outside.

## New archetypes spotted

- L-lane dig-out (555): nearly everything blocked, one long L-shaped lane.
- Pillars (900): full-height walls into 3-wide wells.
- Bay (480, 201): a funnel that ends in a short wide room, or several small bays fed by portals.
- Conveyor cross (580): two crossing belts dividing the board into four quadrants.
- Edge walls (670): barriers on cell edges, not cells. Out of scope for now.
- Crenellated roof (188, 320, 850): spawners alternate with voids across the top.
- Slotted shelf (188, 241): a full-width blocker row with one gap, the drop goes through the gap.
- Twin vaults (366, 505): two or more identical set pieces, so goals double.

## Templates to steal

Notes on all templates: top-row playable cells spawn. `S` marks extra spawners. Every region is fed by a top spawn, an `S` or a portal egress. Cells with a void above them rely on Override's diagonal fill, which is fed by neighbours that have a tile; I kept voids narrow (2 cells or fewer wide above a filled row) so no pocket is roofed over. A legal match exists at start in every template because every one has at least a 3x3 open patch with free swaps. Goal key: tiles = collect a colour, crack = clear encrypted cells, firewall = unlock firewalled tiles, drop = bring an item to `E`.

### T01 Plain 7x7
Tags: open, tutorial. Goals: tiles.
```
#######
#######
#######
#######
#######
#######
#######
```

### T02 Chamfer 8x8
Tags: open, corners. Goals: tiles, crack.
```
.######.
########
########
########
########
########
########
.######.
```

### T03 Diamond 9x9
Tags: shape, diagonal fill. Goals: tiles, crack (rim). From levels 137 and 1100.
```
....#....
...###...
..#####..
.#######.
#########
.#######.
..#####..
...###...
....#....
```

### T04 Hourglass 9x9
Tags: neck, bottleneck. Goals: tiles, drop (E on the bottom row). From levels 480 and 137.
```
#########
.#######.
..#####..
...###...
...###...
...###...
..#####..
.#######.
#########
```

### T05 Ring 8x8
Tags: frame, loop. Goals: tiles, crack (a few encrypted cells on the rim). From level 280. The hollow is two wide so the cells under it are fed diagonally.
```
########
########
###..###
###..###
###..###
###..###
########
########
```

### T06 Ring vault 9x9
Tags: vault, set piece. Goals: crack (core), firewall (firewall tiles on the ring). From levels 100, 505 and 366.
```
#########
#########
#########
###bbb###
###bBb###
###bbb###
#########
#########
#########
```

### T07 Bridge split 9x9
Tags: split halves, two wells. Goals: tiles (two colours, one per half), firewall. From level 16.
```
####.####
####.####
####.####
####.####
####.####
####.####
#########
#########
#########
```

### T08 Chimney 9x9
Tags: wall, split. Goals: crack (the wall `B` cells), tiles. From levels 730 and 262.
```
####B####
####B####
####B####
####B####
####B####
####B####
####B####
####B####
####B####
```

### T09 Relay split 9x9
Tags: portal, one-way feed, asymmetric. Goals: tiles, crack. From levels 70 and 76. The right half has no top spawn: it is fed only by four portals from the bottom of the left half.
```
####.....
####.....
####.pqrt
####.####
####.####
####.####
####.####
####.####
pqrt.####
```
Legend: ingress p q r t at row 8, columns 0 to 3; egress p q r t at row 2, columns 5 to 8. Right half rows 2 to 8, left half rows 0 to 8.

### T10 Ring road 9x9
Tags: crossover teleporters, loop, free cascades. Goals: tiles, crack. From the portal ingredient levels (76, 137) and the loops in the level-layouts note. Both halves also spawn from portals only on their top row, so tiles circulate.
```
uvwx.pqrt
####.####
####.####
####.####
####.####
####.####
####.####
####.####
pqrt.uvwx
```
Legend: p q r t ingress at row 8 columns 0 to 3, egress at row 0 columns 5 to 8. u v w x ingress at row 8 columns 5 to 8, egress at row 0 columns 0 to 3. Risk: a loop with no sink is a closed system, so the generator must give both halves goals.

### T11 Flip relay 7x7
Tags: snake, portal, two bands. Goals: tiles, drop (D in the top band, E in the bottom band). From the snake and portal levels. Seven pairs in a mirrored order, so the band below is fed in reverse.
```
#######
#######
pqrtuvw
.......
wvutrqp
#######
#######
```
Legend: ingress p q r t u v w at row 2, columns 0 to 6; egress at row 4, columns 6 to 0 (so p enters at column 6). Band A is rows 0 to 2, band B rows 4 to 6. Each band is 3 tall by 7 wide, so matches exist.

### T12 Bay funnel 9x9
Tags: drop race, funnel, bay. Goals: drop (two D at the top, E in the bay), tiles. From levels 480 and 201.
```
D#######D
#########
#########
#########
#########
#########
BB.###.BB
BB.###.BB
BB.EEE.BB
```

### T13 Slotted shelf 9x9
Tags: drop race, shelf, gap. Goals: drop (E on the bottom row), crack (the shelf cells). From levels 188, 241 and 160.
```
D#######D
#########
#########
#########
#########
#########
bbbb#bbbb
#########
EEEEEEEEE
```

### T14 Pillars 9x9
Tags: wells, walls. Goals: tiles (a colour per well), crack (pillars). From level 900.
```
#########
#########
#########
B###B###B
B###B###B
B###B###B
B###B###B
B###B###B
B###B###B
```

### T15 L-lane dig-out 8x8
Tags: dig-out, lane. Goals: crack (the whole block), tiles. From level 555.
```
########
##bbbbbb
##bbbbbb
##bbbbbb
##bbbbbb
##bbbbbb
##bbbbbb
##bbbbbb
```

### T16 Bottom vault 9x9
Tags: vault, layers, side slot. Goals: crack, tiles. From levels 435 and 305. A one-cell lane down the left edge keeps the vault region fed; the vault itself is five rows of blockers.
```
#########
#########
#########
#########
#bbbbbbbb
#bbbbbbbb
#BBBBBBBB
#BBBBBBBB
#bbbbbbbb
```

### T17 Edge lanes 9x9
Tags: frame sides, lanes. Goals: crack (edge blocks), firewall. From levels 223 and 760.
```
B#######B
B#######B
B#######B
B#######B
B#######B
B##b#b##B
B#######B
B#######B
B#######B
```

### T18 Conveyor cross 9x9
Tags: conveyor, four quadrants. Goals: crack (quadrant blockers), tiles. From level 580. Requires a conveyor rule (the roadmap lists it); the `=` cells are playable and carry tiles one step toward the centre per move.
```
####=####
#bbb=bbb#
#bbb=bbb#
#bbb=bbb#
=========
#bbb=bbb#
#bbb=bbb#
#bbb=bbb#
####=####
```

### T19 Bite 9x9
Tags: asymmetric, notch. Goals: tiles, firewall. From level 800. The void is only two cells wide, so cells under it are fed diagonally.
```
#########
##..#####
##..#####
##..#####
#########
#########
#########
#########
#########
```

### T20 Stairs 8x8
Tags: asymmetric, slope. Goals: tiles, crack (the stair edge). Invented from the unequal column heights of levels 530 and 460.
```
########
#######.
######..
#####...
####....
###.....
##......
#.......
```
Every cell has a filled cell above it, so only top-row spawns are needed. The bottom right is empty, so tiles pile on the left.

### T21 Funnel 9x9
Tags: funnel, neck, drop. Goals: drop (E at the bottom centre), tiles. From levels 480 and 1100.
```
#########
#########
.#######.
.#######.
..#####..
..#####..
...###...
...###...
...EEE...
```

### T22 Crenellated roof 9x9
Tags: roof, spawn gaps. Goals: tiles, crack. From levels 188, 320 and 850. Row 1 cells under a void are fed diagonally.
```
#.#.#.#.#
#########
#########
#########
#########
#########
#########
#########
#########
```

### T23 Plus 9x9
Tags: cross, arms, spawners. Goals: tiles, crack (arm ends). Invented from levels 137 and 201 (shape with separate bays). The side arms have a void above them, so they carry `S` spawners.
```
...###...
...###...
...###...
SSS###SSS
#########
#########
...###...
...###...
...###...
```

### T24 Twin vaults 9x9
Tags: vault, two set pieces, doubled goal. Goals: crack, firewall. From levels 366 and 505. The 2x2 `B` blocks sit under open cells, so cells under them are fed diagonally.
```
#########
#########
#BB###BB#
#BB###BB#
#########
#########
##b###b##
##bbbbb##
#########
```

### T25 Locked corners 9x9
Tags: corners, core. Goals: crack (core), firewall (corners). From level 41.
```
B#######B
#########
##bbbbb##
##bBBBb##
##bBBBb##
##bbbbb##
#########
#########
B#######B
```

### T26 Terrace 9x9
Tags: asymmetric, step, spawners. Goals: tiles, firewall. From the uneven boards of levels 460 and 800. The right part starts at row 3 and carries its own spawners `S`.
```
#####....
#####....
#####....
#####SSSS
#########
#########
#########
#########
#########
```

## Notes for the generator

- Voids that sit above playable cells must be at most two wide or ringed by `S` spawners; otherwise a pocket is roofed and stays empty (the core rule).
- Portal templates (T09, T10, T11) need every egress row filled, as shown, since only egress cells feed their region.
- T18 needs a rule Override does not have yet (conveyors), and T09, T10 and T11 need teleporters. They are listed because the gallery shows them often.
