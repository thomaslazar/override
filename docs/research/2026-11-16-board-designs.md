# Board designs from other match-3 games

Date: 2026-11-16. Builds on `2026-11-11-layout-gallery.md` (Candy Crush Saga levels from candycrush-cheats.com) and `2026-11-11-level-layouts.md` (mechanics). Those covered Candy Crush Saga only; this pass looks at the other big match-3 games, collects their board-shape patterns, and draws 37 candidate templates for `src/layouts.js`.

## Method and honesty note

- Boards were viewed as images in a Playwright browser: Bing image search results laid out as contact sheets, then the interesting ones enlarged. Fandom wikis are partly blocked to bots, so most images come from YouTube thumbnails, Pinterest pins, fan wikis that did load (Farm Heroes Saga, Cookie Jam, Bejeweled, Jewel Quest) and the iPhone App Store screenshot sets. The Bing query is given per game; individual source pages are listed where a specific board is described.
- Grids below are drawn from memory of small, often annotated screenshots. Shapes are right to a cell or so; blockers are ignored. Nothing is copied 1:1 from any one level: every candidate takes a generic shape (a heart, a ziggurat, an H) and redraws it for our rules and our 7 to 9 square.
- Many image results are 16:9 crops: YouTube thumbnails, tablet or PC versions, emulator captures. Those are marked “landscape capture” below and do not show the phone layout. Phone layout was checked against the iPhone App Store screenshot sets (1242 x 2688 and 1284 x 2778 portrait images) where available. Items marked (recall) are general knowledge, not checked in this pass.
- Puzzle & Dragons and Best Fiends (hex) were skipped as asked. Gems of War and Puzzle Quest were not viewed; from recall both use a plain 8 x 8 square in every battle and have no board shapes, so they add nothing here.

## 1. Per-game notes

Size is width x height in cells, counted from screenshots (approximate).

### Candy Crush Saga (King)

- Orientation: portrait on phones (App Store set, https://apps.apple.com/us/app/candy-crush-saga/id553834731). Board at most 9 x 9 (recall, consistent with the earlier gallery); typical 9 x 9 or 9 x 8 with holes.
- Patterns new to us beyond the earlier gallery: a lattice of single holes like a waffle (fan level, https://candy-crush-saga-fanon.fandom.com/wiki/Level_1574_(CCR)); an H or aeroplane made of 1-wide tubes with cannons on top (fan blog, https://candycrush.fandom.com/wiki/User_blog:Crestune9/Level_ideas_-_2); a crenellated top with a cannon on each tower (https://www.reddit.com/r/candycrush/comments/1cmrlyb/). Source quality: fan-made levels show what players expect, not King’s own boards.
- Search: https://www.bing.com/images/search?q=candy+crush+saga+level+shaped+like+letter+board

### Candy Crush Soda Saga (King)

- Orientation: portrait (all screenshots seen are portrait phone captures). Width 9; height 9 typical, some boards visibly taller (level 951 about 9 x 10; recall: Soda allows taller boards than Saga).
- Patterns: a robot face (rounded head, two 1 x 2 eye holes, shoulders notched; https://www.pinterest.com/pin/app-shopper-candy-crush-soda-saga-games--1132936849980415861/); a winding 1 to 2 wide ice channel that zigzags down beside the main block, a snake made by shape alone (level 951, https://mwm.ai/apps/candy-crush-soda-saga/850417475); two offset blocks forming a Z (https://www.youtube.com/watch?v=bfRLGOgkqWQ); three lanes, two 1-wide tubes either side of a main block (https://educationzopa.weebly.com/blog/levels-in-candy-crush-soda-saga); chocolate legs hanging from the floor, a comb (https://www.youtube.com/watch?v=9xMxsv8w3lg).
- Search: https://www.bing.com/images/search?q=candy+crush+soda+saga+level+board

### Royal Match (Dream Games)

- Orientation: portrait (App Store set and the level-analysis collages are all portrait phone captures; https://apps.apple.com/us/app/royal-match/id1482155847). Boards are taller than wide: typically 8 or 9 wide by 9 to 10 tall; never wider than 9 in what we saw.
- Patterns: mostly full rectangles; shape comes from blocks rather than holes. Seen: a stepped ziggurat floor of boxes with king chests in the steps; a board split by a 1-wide off-board column into two 4-wide halves; side hedges that make a 7-wide board; quadrants of different blockers; two locked “curtain” bays at the bottom that open after a count; a notch with a block cluster in the top middle. Sources: https://inf.news/en/game/91e6a4690946b9b1a3bf713028fb6060.html, https://www.lifewire.com/royal-match-how-many-levels-8646004, https://zhuanlan.zhihu.com/p/463780544 (a Chinese teardown of Royal Match board layouts).
- Search: https://www.bing.com/images/search?q=royal+match+level+board+layout

### Homescapes (Playrix)

- Orientation: portrait on phones (App Store set, https://apps.apple.com/us/app/homescapes/id1195621598; the match screenshot shows a small 7 x 5 tutorial board with the goal panel and boosters as columns beside it). Nearly every image search hit is a landscape capture (YouTube, emulator or tablet) showing boards up to about 11 wide by 8 to 9 tall. Whether phones show those wide boards scaled down or a different cut was not confirmed; treat widths above 9 as tablet evidence only.
- Patterns (all landscape captures): a T with two lower side bays (https://www.youtube.com/watch?v=j5SJtIGFduY); organ pipes, 2-wide columns of different heights with portal glows at their ends (https://www.youtube.com/watch?v=upUUG_ZNRws); crenellated columns (https://www.youtube.com/watch?v=Bbmjwq4baPs); a castle with raised corner turrets and a dip in the middle (https://www.youtube.com/watch?v=sjujJc4r50g); two halves joined by drawn portal links with a narrow middle shaft (https://www.youtube.com/watch?v=Y8PoylNvzCc); two U letters with dotted portal paths (https://www.artstation.com/artwork/aGaRB8); a stepped crown (https://www.youtube.com/watch?v=_tz9763U4pQ); staggered islands (https://www.youtube.com/watch?v=DIWNUakooi0, https://www.youtube.com/watch?v=VSzzhxXUBww); a goblet or Y, two upper rooms over a hole with a stem (https://www.pocketgamer.com/homescapes/tips-and-cheats-advice-to-help-clear-every-level/); vertical stripes (https://www.youtube.com/watch?v=scoRfmoQSZw); two columns plus a floating 1 x 2 island (https://www.youtube.com/watch?v=fD7Q-pLZst8).
- Search: https://www.bing.com/images/search?q=homescapes+hard+level+board+screenshot

### Gardenscapes (Playrix)

- Orientation: portrait on phones (App Store set, https://apps.apple.com/us/app/gardenscapes/id1105855019; the match shot is a board about 6 to 7 wide by 9 tall with notched corners, the goal panel and boosters as columns at its sides). Search hits are landscape captures with boards up to about 12 wide by 8 tall.
- Patterns: an L-shaped water hole inside the board (https://www.youtube.com/watch?v=6nal0UG467o); a plus with four 2 x 2 rooms around it (https://www.youtube.com/watch?v=z6FYGbksSGk); a 1-wide U channel around a pool (https://www.youtube.com/watch?v=2l2fTuUFDbQ); three offset rooms in an S (https://www.youtube.com/watch?v=J7Jhj_doNV4); a 1-wide hook path around a block, a spiral in all but name (https://www.reddit.com/r/Gardenscapes/comments/1aoehxu/amazing_level_design/); a ring of tiles around a hollow bar (https://www.youtube.com/watch?v=zgnXbFRpiOc); a comb of water slits rising from the floor (https://finlandemb.de/gardenscapes-niveau-682-walkthrough/).
- Search: https://www.bing.com/images/search?q=gardenscapes+level+gameplay+board

### Fishdom (Playrix)

- Orientation: portrait on phones (App Store set, https://apps.apple.com/us/app/fishdom/id664575829; its first screenshots show the aquarium, not the board). Search hits are landscape captures, boards about 9 to 11 wide by 8 to 9 tall.
- Patterns, the most shape-driven of the Playrix games: a heart (https://www.youtube.com/watch?v=KZq0dS8SWaw); a stepped pyramid (https://www.youtube.com/watch?v=l4iEhQKG18c); a bridge with two feet under an arch (https://www.youtube.com/watch?v=_rxx4xuYMjs); a tower with crenellations and window holes inside (https://www.youtube.com/watch?v=EB77ProjedI); three bands with a 1-wide middle lane between gaps (https://www.youtube.com/watch?v=sqpbQTvzPLw); shelves of blockers with gaps (https://www.youtube.com/watch?v=Yoh9Tyqg1QA).
- Search: https://www.bing.com/images/search?q=fishdom+match+3+level+board+gameplay

### Toon Blast (Peak; shapes only, it is a tap-to-blast game)

- Orientation: portrait (App Store set, https://apps.apple.com/us/app/toon-blast/id1176027022; YouTube captures are portrait phone screens letterboxed into 16:9). Board 9 wide by 9 to 11 tall.
- Patterns, pictures more than geometry: a heart (https://www.youtube.com/watch?v=NC9Am_KfN14); a butterfly or X, four lobes pinched at the waist (https://www.youtube.com/watch?v=pVDRLjTwb88); a space-invader silhouette with legs (https://www.youtube.com/watch?v=_nSrJDaZVhE); a rounded cross or shield (https://www.youtube.com/watch?v=7fCeRmsFL0c); a skewed zigzag, rows shifted like a parallelogram (https://www.youtube.com/watch?v=0j2vz16mzNM); a vase with a neck (https://www.youtube.com/watch?v=OQU9HFt9qSE); concentric square rings as colour bands (App Store).
- Search: https://www.bing.com/images/search?q=toon+blast+level+board+gameplay

### Cookie Jam (Jam City)

- Orientation: the captures seen are landscape with the goal panel at the side (fan wiki and YouTube), so likely tablet. Phone orientation not confirmed (the App Store id we tried did not resolve). Boards about 9 to 10 wide by 8 to 9 tall in those captures.
- Patterns: a tiered cake, three 1-cell turrets on a narrow upper tier over a wide base (https://cookie-jam.fandom.com/wiki/Level_14); crenellated tops with notched bottom corners (https://www.youtube.com/watch?v=uetD0RY_lPI, https://www.youtube.com/watch?v=CfMLIluHVyo); irregular offset columns (https://www.youtube.com/watch?v=Zn28VuPk1pc).
- Search: https://www.bing.com/images/search?q=cookie+jam+level+board+gameplay

### Farm Heroes Saga (King)

- Orientation: portrait (App Store set, https://apps.apple.com/us/app/farm-heroes-saga/id608206510, and the fan wiki images). Board 9 x 9 typical, some 8 wide.
- Patterns: a bucket whose sides step in at the bottom (https://farm-heroes-saga.fandom.com/wiki/Level_1701); staircase edges, a diagonal profile on one side (https://farm-heroes-saga.fandom.com/wiki/Level_200, https://farm-heroes-saga.fandom.com/wiki/Level_586); horizontal water slits forming a channel inside the board (https://farm-heroes-saga.fandom.com/wiki/Level_1074); a bite out of one side for scenery (https://farm-heroes-saga.fandom.com/wiki/Level_186). Mostly full rectangles otherwise.
- Search: https://www.bing.com/images/search?q=farm+heroes+saga+level+board

### Bejeweled (Stars, Blitz, 3; EA / PopCap)

- Orientation: Bejeweled Stars is portrait, board about 9 wide by 9 tall (https://bejeweled.fandom.com/wiki/List_of_Bejeweled_Stars_levels). Blitz and 3 are a fixed 8 x 8 square with no shapes (recall).
- Patterns (Stars): a bow tie, a downward triangle and an upward triangle meeting at a full-width bar (fandom list image); two square holes in diagonally opposite quadrants (https://www.youtube.com/watch?v=_qFZewJEe8w).
- Search: https://www.bing.com/images/search?q=bejeweled+stars+level+board

### Jewel Quest (iWin)

- Orientation: PC and tablet, landscape; boards about 10 x 8. Not a phone-first game.
- Patterns: picture silhouettes with a pedestal tab under them, crowns and urns (https://jewelquest.wiki.gg/wiki/Level_5-2_(Jewel_Quest_II)). The goal is to turn every cell gold, so the outline itself is the level.
- Search: https://www.bing.com/images/search?q=jewel+quest+level+board+shape

### Lily’s Garden (Tactile)

- Orientation: the US App Store set is landscape marketing art; the capture we saw is a 16:9 video frame. Phone orientation not confirmed (recall: portrait). Board in the capture about 11 x 8.
- Patterns: rounded octagons and blobs with chamfered corners and a notch (https://www.youtube.com/watch?v=m54lRAq33YU).
- Search: https://www.bing.com/images/search?q=lily%27s+garden+match+3+level+board

### Matchington Mansion (Firecraft)

- Orientation: captures are 16:9 frames with side panels like Playrix; phone orientation not confirmed. Boards about 9 to 10 wide by 8 to 9 tall in those captures.
- Patterns: a heart with a crenellated top and a 1-wide tail (https://www.youtube.com/watch?v=Sf0lECFoosc); a bowl with a stepped V cavity open at the top (https://www.youtube.com/watch?v=jBfKoq_qQ_s).
- Search: https://www.bing.com/images/search?q=matchington+mansion+level+board

### Angry Birds Match (Rovio)

- Orientation: portrait, boards about 7 to 9 wide by 8 to 9 tall.
- Patterns: a plus with a tail, a bird-like silhouette (https://www.gamesparkles.com/games/angry_birds_match); a rectangle with one stepped corner (https://www.gamezebo.com/reviews/angry-birds-match-review-a-cheep-knockoff/).
- Search: https://www.bing.com/images/search?q=angry+birds+match+level+board

### Disney Emoji Blitz (Jam City)

- Orientation: portrait, a plain 7 x 7 square every time (https://mwm.ai/apps/disney-emoji-blitz-game/1017551780). A timed blitz game: no shapes at all, variety comes from powers. Confirms that a square board alone carries a score-attack game but not a level map.

## 2. Orientation and aspect

- **Every phone-first match-3 we checked plays in portrait.** All App Store iPhone sets we opened (Candy Crush Saga, Royal Match, Homescapes, Gardenscapes, Fishdom, Toon Blast, Farm Heroes Saga) are portrait 1242 x 2688 or 1284 x 2778 images. Landscape boards in search results come from tablets, PCs (Jewel Quest, Bejeweled 3) or YouTube and emulator captures.
- **Board width tops out at 9 on phones.** Candy Crush Saga and Soda, Royal Match, Toon Blast, Farm Heroes Saga and Bejeweled Stars are 9 wide at most; Playrix phone shots show 6 to 8 wide because the goal panel and boosters sit as columns beside the board. Boards wider than 9 (Playrix up to 12, Jewel Quest 10) appear only in landscape captures.
- **Height is the free axis.** Royal Match and Toon Blast boards are commonly 9 to 11 tall on a 9-wide board; Soda has some taller boards. Candy Crush Saga keeps 9 x 9 as its maximum.
- **Common sizes:** 9 x 9 (King games, Bejeweled Stars), 8 or 9 wide by 9 to 10 tall (Royal Match), 9 x 10 to 11 (Toon Blast), 8 x 8 (Bejeweled Blitz and 3, Gems of War, Puzzle Quest; recall), 7 x 7 (Emoji Blitz).
- **For Override:** our 7 to 9 square sits right in the phone range. A 9-wide board matches the widest phone boards; the one thing we lack is the extra height (9 x 10 or 9 x 11), which shows up as mechanic idea 37 below. Shapes inside the square do the work that aspect does elsewhere.

## 3. Pattern families

Counts are of the boards viewed in this pass (about 120 board images over 14 games, plus the 49 Candy Crush boards from the earlier gallery), so read them as rough shares.

| Family | What it is | Seen in | How common |
| --- | --- | --- | --- |
| Full rectangle with blocker shapes | No holes; the shape is drawn with blockers | Royal Match, Farm Heroes, Candy Crush, Toon Blast | Most common of all, about half of boards |
| Chamfer and notch | Corners or edges trimmed by 1 to 2 cells | Every game | Very common |
| Picture silhouettes | Heart, butterfly, vase, face, invader, crown | Fishdom, Toon Blast, Matchington, Soda, Jewel Quest | Common in Fishdom and Toon Blast, rare in King games |
| Ziggurat and staircase | Stepped sides, pyramids, parallelograms | Fishdom, Farm Heroes, Toon Blast, Royal Match, Cookie Jam | Common |
| Crenellation and towers | Gaps along the top, turrets | Cookie Jam, Fishdom, Homescapes, Candy Crush | Common |
| Columns and lanes | Separate vertical lanes, organ pipes, combs | Homescapes, Fishdom, Soda, Candy Crush | Common in Playrix games |
| Interior holes | Windows, eye holes, pools, slits | Fishdom, Soda, Gardenscapes, Bejeweled Stars, Farm Heroes | Common |
| Islands and offset rooms | Separate or barely touching regions | Homescapes, Gardenscapes, Soda | Moderate, mostly Playrix |
| Letters | H, T, U, L, Y | Homescapes, Gardenscapes, Candy Crush fan levels | Moderate |
| Split halves | Two halves divided by a column | Royal Match, Homescapes, Candy Crush | Moderate |
| Portal paths | Visible links between distant ends | Homescapes, Candy Crush | Moderate, harder levels |
| Rings and frames | Hollow middle, tiles around it | Gardenscapes, Matchington, Toon Blast | Moderate |
| Narrow channels and spirals | 1-wide winding paths | Soda, Gardenscapes | Rare, as a side feature only |
| Locked bays | Rooms that open after a goal count | Royal Match (curtains), Homescapes | Rare |
| Conveyors and moving parts | Belts, rotating parts | Candy Crush, Soda | Rare |

What we take from it: the cheap, readable families (silhouettes, ziggurats, towers, interior holes, letters) are under-used in our 16 templates, which lean on walls and teleporters. Narrow 1-wide channels are always a side feature in the big games, never the whole board, because they hold no horizontal matches.

## 4. Candidate templates

Format: rows of space-separated tokens exactly as in `src/layouts.js`. Tags, mirror, band (`dMin` to `dMax`), effort and drop schedule are first guesses for the `T(...)` call, to be tuned with `tools/sim.mjs`. None repeats one of our 16 templates or the earlier gallery’s drafts.

**Verification.** All 30 group (a) candidates were run through `parse` and `check` from `src/layouts.js`, unmirrored and mirrored, with a script in the session scratchpad (not in the repo). All 30 pass both ways (an earlier draft of heist, a closed vault without a spawner, failed and was redrawn as an open cup). Split boards (gate, yoke, stagger) have odd sizes. `check` covers fill, teleporter pairs, loops, drop reachability and a legal move after filling; it does not judge whether a board is fun or tuned, so every one still needs a sim run.

Design rules learned while drawing (from `gravity` in `src/core.js`): a cell under a hole or block fills only by a diagonal slide from the row above, so a roof of holes over live cells may widen by at most one cell per row on each side; anything wider needs an `S` there. A top-row cell never fills unless it is a spawner, so once a template marks any `S`, every live top-row cell must be `S` or an egress.

### 4a. Fit current mechanics (30)

#### Shapes and walled boards (18)

##### heart (9 x 9)

A heart: two lobes on top, a point at the bottom. A friendly early shape. Inspired by: Fishdom, Matchington Mansion, Toon Blast.
Tags: shape. Mirror: no. Band: 0 to 0.5 (easy to medium). Effort: 0.8.

```
o . . . o . . . o
. . . . . . . . .
. . . . . . . . .
. . . . . . . . .
. . . . . . . . .
o . . . . . . . o
o o . . . . . o o
o o o . . . o o o
o o o o . o o o o
```

##### ziggurat (9 x 9)

A stepped pyramid: narrow top, wide base. Cascades pile up in the base. Inspired by: Fishdom (pyramid), Cookie Jam (tiered cake).
Tags: shape. Mirror: no. Band: 0.1 to 0.6 (easy to medium). Effort: 0.8.

```
o o o . . . o o o
o o o . . . o o o
o o . . . . . o o
o o . . . . . o o
o . . . . . . . o
o . . . . . . . o
. . . . . . . . .
. . . . . . . . .
. . . . . . . . .
```

##### bucket (7 x 7)

A 7 x 7 bucket: full top, sides stepping in at the bottom. Inspired by: Farm Heroes Saga.
Tags: shape. Mirror: no. Band: 0 to 0.5 (easy to medium). Effort: 0.8.

```
. . . . . . .
. . . . . . .
. . . . . . .
o . . . . . o
o . . . . . o
o o . . . o o
o o . . . o o
```

##### battlements (9 x 9)

Three towers on top (two 2-wide gaps of holes), open hall below. Inspired by: Cookie Jam, Fishdom, Homescapes.
Tags: shape. Mirror: no. Band: 0.1 to 0.6 (easy to medium). Effort: 0.85.

```
. . o o . o o . .
. . o o . o o . .
. . o o . o o . .
. . . . . . . . .
. . . . . . . . .
. . . . . . . . .
. . . . . . . . .
. . . . . . . . .
. . . . . . . . .
```

##### offset (8 x 8)

Two 2 x 2 holes in opposite quadrants; mirror flips the diagonal. Inspired by: Bejeweled Stars.
Tags: shape. Mirror: yes. Band: 0.2 to 0.7 (easy to hard). Effort: 0.85.

```
. . . . . . . .
. . . . . . . .
. . o o . . . .
. . o o . . . .
. . . . o o . .
. . . . o o . .
. . . . . . . .
. . . . . . . .
```

##### bowtie (9 x 9)

Two triangles tip to tip with a full crossbar fed by side spawners (cannons in the wings). Inspired by: Bejeweled Stars.
Tags: shape. Mirror: no. Band: 0.4 to 0.9 (medium to hard). Effort: 0.6.

```
S S S S S S S S S
o . . . . . . . o
o o . . . . . o o
o o o . . . o o o
S S . . . . . S S
o o o . . . o o o
o o . . . . . o o
o . . . . . . . o
. . . . . . . . .
```

##### goblet (9 x 9)

Two upper bowls split by a 1-wide hole column, a stem, and a foot. Inspired by: Homescapes (Y-shaped boards).
Tags: shape. Mirror: no. Band: 0.3 to 0.8 (easy to hard). Effort: 0.75.

```
. . . . o . . . .
. . . . o . . . .
. . . . o . . . .
. . . . . . . . .
o o . . . . . o o
o o o . . . o o o
o o o . . . o o o
o o . . . . . o o
o . . . . . . . o
```

##### arch (8 x 8)

An 8 x 8 bridge: solid top, two 3-wide legs under a 2-wide arch. Inspired by: Fishdom (bridge), Toon Blast (legs).
Tags: shape. Mirror: no. Band: 0.1 to 0.6 (easy to medium). Effort: 0.8.

```
. . . . . . . .
. . . . . . . .
. . . . . . . .
. . . . . . . .
. . . . . . . .
. . . o o . . .
. . . o o . . .
. . . o o . . .
```

##### slope (8 x 8)

A parallelogram: rows shift one cell per row, top left to bottom right. Inspired by: Toon Blast, Farm Heroes Saga, Candy Crush Soda.
Tags: shape. Mirror: yes. Band: 0.2 to 0.7 (easy to hard). Effort: 0.8.

```
. . . . o o o o
. . . . . o o o
. . . . . . o o
. . . . . . . o
o . . . . . . .
o o . . . . . .
o o o . . . . .
o o o o . . . .
```

##### terrace (9 x 9)

Two offset rooms that overlap in the middle; the right room has its own spawners. Inspired by: Gardenscapes (offset rooms), Homescapes.
Tags: shape, walled. Mirror: yes. Band: 0.3 to 0.8 (easy to hard). Effort: 0.7.

```
S S S S S o o o o
. . . . . o o o o
. . . . . o o o o
. . . . . S S S S
. . . . . . . . .
. . . . . . . . .
o o o o . . . . .
o o o o . . . . .
o o o o . . . . .
```

##### valley (9 x 9)

A V-shaped bite out of the top middle; tiles slide down both slopes. Inspired by: Matchington Mansion, Gardenscapes (U and bowl boards).
Tags: shape. Mirror: no. Band: 0.1 to 0.6 (easy to medium). Effort: 0.8.

```
. . o o o o o . .
. . . o o o . . .
. . . . o . . . .
. . . . . . . . .
. . . . . . . . .
. . . . . . . . .
. . . . . . . . .
. . . . . . . . .
. . . . . . . . .
```

##### mask (9 x 9)

A face: two eye holes, chamfered top, a notched chin. Inspired by: Candy Crush Soda (face board).
Tags: shape. Mirror: no. Band: 0.2 to 0.7 (easy to hard). Effort: 0.8.

```
o o . . . . . o o
o . . . . . . . o
. . o o . o o . .
. . o o . o o . .
. . . . . . . . .
. . . . . . . . .
. . . . . . . . .
o . . . . . . . o
o o . o o o . o o
```

##### plus (9 x 9)

A plus with spawners at the ends of the side arms. Inspired by: Gardenscapes, Toon Blast, Angry Birds Match.
Tags: shape. Mirror: no. Band: 0.2 to 0.7 (easy to hard). Effort: 0.8.

```
o o S S S S S o o
o o . . . . . o o
S S . . . . . S S
. . . . . . . . .
. . . . . . . . .
. . . . . . . . .
. . . . . . . . .
o o . . . . . o o
o o . . . . . o o
```

##### butterfly (9 x 9)

Four lobes pinched at the waist, a 1-wide slot top and bottom. Inspired by: Toon Blast.
Tags: shape. Mirror: no. Band: 0.3 to 0.8 (easy to hard). Effort: 0.75.

```
. . . . o . . . .
. . . . o . . . .
. . . . . . . . .
o . . . . . . . o
o o . . . . . o o
o . . . . . . . o
. . . . . . . . .
. . . . o . . . .
. . . . o . . . .
```

##### vase (9 x 9)

A neck at the top, a wide belly, a narrow foot. Inspired by: Toon Blast, Lily’s Garden (rounded blobs).
Tags: shape. Mirror: no. Band: 0.2 to 0.7 (easy to hard). Effort: 0.75.

```
o o . . . . . o o
o o o . . . o o o
o o . . . . . o o
o . . . . . . . o
. . . . . . . . .
. . . . . . . . .
o . . . . . . . o
o o . . . . . o o
o o o . . . o o o
```

##### gate (9 x 9)

An H: two 4-wide legs joined by a crossbar; split in the middle column above and below. Inspired by: Candy Crush fan levels, Homescapes letter shapes.
Tags: split, shape. Mirror: no. Band: 0.4 to 0.9 (medium to hard). Effort: 0.5.

```
. . . . o . . . .
. . . . o . . . .
. . . . o . . . .
. . . . . . . . .
. . . . . . . . .
. . . . . . . . .
. . . . o . . . .
. . . . o . . . .
. . . . o . . . .
```

##### tee (9 x 9)

A T: wide top, walled stem, two side bays with their own spawners joining the stem low down. Inspired by: Homescapes (T board with side bays).
Tags: walled. Mirror: no. Band: 0.5 to 1 (medium to hard). Effort: 0.5.

```
S S S S S S S S S
. . . . . . . . .
. . . . . . . . .
o o # . . . # o o
o o # . . . # o o
S S # . . . # S S
. . # z z z # . .
. . . z z z . . .
. . . z z z . . .
```

##### safe (9 x 9)

A walled 3 x 3 vault with its own spawner, leaking through a one-cell door into the hall. Inspired by: Homescapes, Gardenscapes (caged rooms).
Tags: walled. Mirror: no. Band: 0.5 to 1 (medium to hard). Effort: 0.6.

```
S S S S S S S S S
. . . . . . . . .
. . # # # # # . .
. . # S S S # . .
. . # z z z # . .
. . # z z z # . .
. . # # . # # . .
. . . . . . . . .
. . . . . . . . .
```

#### Teleporter boards (5)

##### donut (9 x 9)

A 3 x 3 hole in the middle; tiles jump straight across it through three teleporters. Inspired by: Gardenscapes and Matchington (rings), Homescapes portals.
Tags: teleport, shape. Mirror: no. Band: 0.2 to 0.7 (easy to hard). Effort: 0.9.

```
S S S S S S S S S
. . . . . . . . .
. . . iA iB iC . . .
. . . o o o . . .
. . . o o o . . .
. . . o o o . . .
. . . eA eB eC . . .
. . . . . . . . .
. . . . . . . . .
```

##### switchback (9 x 9)

Three 3-wide lanes in series: lane 1 bottom feeds lane 2 top, lane 2 feeds lane 3. Inspired by: Homescapes (portal paths), Candy Crush Soda (zigzag channel).
Tags: teleport, snake. Mirror: yes. Band: 0.4 to 1 (medium to hard). Effort: 1.2.

```
S S S eA eB eC eD eE eF
. . . . . . . . .
. . . . . . . . .
. . . . . . . . .
. . . . . . . . .
. . . . . . . . .
. . . . . . . . .
. . . . . . . . .
iA iB iC iD iE iF . . .
```

##### fountain (9 x 9)

The middle lane spawns; its bottom feeds the tops of the two side lanes, so tiles “rise” at the edges. Inspired by: Homescapes (organ-pipe columns with portals).
Tags: teleport. Mirror: no. Band: 0.4 to 0.9 (medium to hard). Effort: 0.9.

```
eA eB S S S S S eC eD
. . . . . . . . .
. . . . . . . . .
. . . . . . . . .
. . . . . . . . .
. . . . . . . . .
. . . . . . . . .
. . . . . . . . .
. . iA iB . iC iD . .
```

##### delta (9 x 9)

Side lanes spawn; one cell from each side’s bottom feeds the middle lane’s top. Inspired by: Homescapes, Fishdom (three columns).
Tags: teleport, funnel. Mirror: no. Band: 0.3 to 0.8 (easy to hard). Effort: 0.9.

```
S S S eA S eB S S S
. . . . . . . . .
. . . . . . . . .
. . . . . . . . .
. . . . . . . . .
. . . . . . . . .
. . . . . . . . .
. . . . . . . . .
. iA . . . . . iB .
```

##### stagger (9 x 9)

Two islands offset diagonally; the upper island’s bottom feeds the lower island’s top. Inspired by: Homescapes (staggered islands), Gardenscapes.
Tags: teleport, split. Mirror: yes. Band: 0.5 to 1 (medium to hard). Effort: 0.6.

```
S S S S S o o o o
. . . . . o o o o
. . . . . o o o o
iA iB iC iD iE o o o o
o o o o o o o o o
o o o o eA eB eC eD eE
o o o o . . . . .
o o o o . . . . .
o o o o . . . . .
```

#### Drop boards (7)

##### hopper (9 x 9)

The bucket as a funnel with one drop point at the bottom of the spout. Inspired by: Farm Heroes Saga (bucket), Candy Crush drop funnels.
Tags: drop, funnel. Mirror: no. Band: 0.2 to 0.6 (easy to medium). Effort: 0.8. Drop schedule: every 3.

```
. . . . . . . . .
. . . . . . . . .
. . . . . . . . .
o . . . . . . . o
o . . . . . . . o
o o . . . . . o o
o o . . . . . o o
o o o . . . o o o
o o o . X . o o o
```

##### scree (8 x 8)

The slope with the drop point in the lowest corner. Inspired by: Toon Blast, Farm Heroes Saga (stair boards).
Tags: drop, shape. Mirror: yes. Band: 0.3 to 0.8 (easy to hard). Effort: 0.8. Drop schedule: every 3.

```
. . . . o o o o
. . . . . o o o
. . . . . . o o
. . . . . . . o
o . . . . . . .
o o . . . . . .
o o o . . . . .
o o o o . . . X
```

##### locket (7 x 7)

A small heart; the drop point is its tip. Inspired by: Fishdom, Matchington Mansion (hearts).
Tags: drop, shape. Mirror: no. Band: 0.2 to 0.7 (easy to hard). Effort: 0.8. Drop schedule: every 0.

```
o . . o . . o
. . . . . . .
. . . . . . .
. . . . . . .
o . . . . . o
o o . . . o o
o o o X o o o
```

##### ledge (9 x 9)

The right column is off board except one nub cell mid-height, the drop point. Drops reach it by a diagonal slide or a swap. Inspired by: Fishdom, Royal Match (side nooks).
Tags: drop. Mirror: yes. Band: 0.4 to 0.9 (medium to hard). Effort: 0.8. Drop schedule: every 0.

```
. . . . . . . . o
. . . . . . . . o
. . . . . . . . o
. . . . . . . . o
. . . . . . . . X
. . . . . . . . o
. . . . . . . . o
. . . . . . . . o
. . . . . . . . o
```

##### yoke (9 x 9)

The H with a drop kind per leg; the only drop point is the middle of the crossbar. Inspired by: Homescapes (two-sided boards), Candy Crush.
Tags: drop, split. Mirror: no. Band: 0.5 to 1 (medium to hard). Effort: 0.8. Drop schedule: every 3.

```
S0 S0 S0 S0 o S1 S1 S1 S1
. . . . o . . . .
. . . . o . . . .
. . . . . . . . .
. . . . . . . . .
. . . . X . . . .
. . . . o . . . .
. . . . o . . . .
. . . . o . . . .
```

##### pachinko (9 x 9)

Staggered single blocks deflect falling drops; one drop point at the bottom middle. Inspired by: Candy Crush Soda (chocolate pegs), Fishdom.
Tags: drop. Mirror: no. Band: 0.3 to 0.8 (easy to hard). Effort: 0.8. Drop schedule: every 3.

```
. . . . . . . . .
. . . . . . . . .
. . # . . . # . .
. . . . # . . . .
. . # . . . # . .
. . . . # . . . .
. . . . . . . . .
. . . . . . . . .
. . . . X . . . .
```

##### heist (9 x 9)

A drop starts in an open cup; swap it up over the rim and down to a corner drop point. Spawners under the cup floor. Inspired by: Royal Match, Homescapes (boxed goals).
Tags: drop, walled. Mirror: no. Band: 0.6 to 1 (hard). Effort: 0.6. Drop schedule: every 0.

```
S S S S S S S S S
. . . . . . . . .
. . . . . . . . .
. . # . . . # . .
. . # . . . # . .
. . # . D0 . # . .
. . # # # # # . .
. . . S S S . . .
X . . . . . . . X
```

### 4b. Need a new mechanic (7)

New tokens are made up for the sketch; the mechanic is named first.

#### carousel (7 x 7). Mechanic: conveyor cells

A ring of conveyor cells round the edge moves every tile one step clockwise after each move; the middle is a plain 5 x 5 well; spawning comes from the conveyor itself or a spawner on the ring. Inspired by Candy Crush and Soda conveyors. Tags: shape, conveyor. Mirror: yes (flips direction). Band: medium to hard. Tokens: `>` `v` `<` `^` live cell that moves its tile that way after a move.

```
> > > > > > v
^ . . . . . v
^ . . . . . v
^ . . . . . v
^ . . . . . v
^ . . . . . v
^ < < < < < <
```

#### maze (9 x 9). Mechanic: edge walls

Thin walls on cell edges (no cell lost) stop swaps and falls across that edge, so the board stays full but the flow winds. Inspired by Candy Crush level 670 edge walls (earlier gallery). Tags: walled, maze. Mirror: yes. Band: hard. Tokens: `._` wall under the cell, `.|` wall on its right.

```
. . . . . . . . .
._ ._ ._ ._ ._ ._ . . .
. . . . . . . . .
. . . ._ ._ ._ ._ ._ ._
. . . . . . . . .
._ ._ ._ ._ ._ ._ . . .
. . . . . . . . .
. . .| . . .| . . .
. . .| . . .| . . .
```

#### sidewind (9 x 9). Mechanic: per-region gravity direction

The left third falls left, the rest falls down, so tiles pile against the wall and drops travel sideways. Inspired by gravity-changing boards in Candy Crush (recall). Tags: shape, gravity. Mirror: yes. Band: hard. Tokens: `<.` cell whose gravity points left.

```
S S S S S S S S S
<. <. <. . . . . . .
<. <. <. . . . . . .
<. <. <. . . . . . .
<. <. <. . . . . . .
<. <. <. . . . . . .
<. <. <. . . . . . .
<. <. <. . . . . . .
<. <. <. . . . . . .
```

#### curtains (9 x 9). Mechanic: locked bays that open after a count

Two bays at the bottom are closed behind curtains until 25 tiles of a colour are cleared; until then they hold their tiles and take no swaps. Inspired by Royal Match curtains. Tags: walled, locked. Mirror: no. Band: medium. Tokens: `L` locked cell (opens with its bay).

```
. . . . . . . . .
. . . . . . . . .
. . . . . . . . .
. . . . . . . . .
. . . . . . . . .
L L L L . L L L L
L L L L . L L L L
L L L L . L L L L
L L L L . L L L L
```

#### mortar (9 x 9). Mechanic: spawners that emit blockers

Two top-corner spawners fire an encrypted cell into the board every few moves, so the level is a race against the clutter. Inspired by Candy Crush cannons that emit blockers (earlier research). Tags: walled, cannon. Mirror: no. Band: hard. Tokens: `K` spawner that also emits a blocker on a schedule.

```
K S S S S S S S K
. . . . . . . . .
. . . . . . . . .
. . . . . . . . .
. . . . . . . . .
. . . . . . . . .
. . . . . . . . .
. . . . . . . . .
. . . . . . . . .
```

#### portcullis (9 x 9). Mechanic: a wall that opens

A block row across the middle lifts after a goal count (or after N moves), joining two halves that played apart until then. Inspired by Royal Match and Homescapes gates and locked boxes. Tags: walled, split, gate. Mirror: no. Band: hard. Tokens: `G` gate block that turns into a live cell when it opens.

```
S S S S S S S S S
. . . . . . . . .
. . . . . . . . .
. . . . . . . . .
G G G G G G G G G
S S S S S S S S S
. . . . . . . . .
. . . . . . . . .
. . . . . . . . .
```

#### tower (9 wide x 11 tall). Mechanic: non-square boards

A 9 x 11 board, the tall phone shape Royal Match and Toon Blast use; the extra rows give a tall drop run. Needs `n x m` boards in the core, layout code and canvas sizing. Tags: shape, tall, drop. Mirror: no. Band: medium.

```
S S S S S S S S S
. . . . . . . . .
. . . . . . . . .
. . . . . . . . .
o . . . . . . . o
o . . . . . . . o
o . . . . . . . o
. . . . . . . . .
. . . . . . . . .
. . . . . . . . .
. . . X . X . . .
```

## Outcome (2026-11-16)

26 of the 30 group (a) boards went into `src/layouts.js`, with effort and bands retuned by sim runs. Left
out: switchback and fountain (slow to prepare, cascade-heavy), stagger (halves too small), heist (drops
trapped in the vault). Ledge and yoke got extra drop points, hopper, scree and pachinko more than one.

## 5. Most promising

1. **donut**: the clearest teleporter board we could add; tiles visibly fall through the hole, a good first teleporter level.
2. **heart**: a picture board players recognise at once; easy, no new rules, good for a breather.
3. **yoke**: two drop kinds, one per leg, meeting at a single drop point in the crossbar; a split board that is still one fight.
4. **fountain**: inverts the usual flow (side lanes are fed from the middle’s bottom); new feel from existing teleporters.
5. **bowtie**: side spawners in the middle of the board give mid-board refills, a flow we do not have yet.

## 6. Notes for whoever adds them

- Add a handful at a time and rerun `node --test` and `node tools/sim.mjs` per batch; effort values above are guesses.
- The drop test in `tests/layouts.test.mjs` caps drop templates at 4; adding the drop candidates needs that bound raised.
- Several shapes (heart, vase, butterfly, valley, mask) are near-symmetric silhouettes; spacing them apart in the level order keeps the “no template within the last five” rule from making them feel like one family.
