# Match-3 level layouts and board mechanics: research

Date: 2026-11-11. Feeds the Override roadmap. Scope: what a seeded generator plus a greedy bot can reproduce.

Source quality note. candycrush.fandom.com returned HTTP 402 to our fetcher, so wiki pages were not read directly. Items marked (verified) come from a page we read or a search result; items marked (recall) are general knowledge of the games, not checked against a source in this pass and should be confirmed in play before we copy a rule exactly. Royal Match, Homescapes and Toy Blast have almost no public design documentation, so those are thin.

## 1. Board shapes

- Candy Crush levels are almost never a plain rectangle. King says designers like "mixing up game board shapes with blockers" ([PocketGamer.biz, complexity staircase](http://www.pocketgamer.biz/crafting-candy-crushs-difficulty-blockers-level-design-ai-and-the-complexity-staircase/), verified). A general guide also says boards should vary in shape level to level ([Gamigion](https://www.gamigion.com/match-3-level-design-principles/)).
- Common shapes (recall): rectangles with corner notches, hourglass or diamond silhouettes, a frame with a hollow middle, columns of unequal height, and several islands joined only by teleporters or none at all. Shapes are usually left-right symmetric; asymmetry is used on purpose for harder levels.
- Holes are simply cells with no tile. Tiles fall around them. A cell under a hole gets tiles by diagonal slide from neighbours or from its own spawner (recall). Override already does diagonal fill, which matches.
- Islands (disconnected regions) need their own feed. In Candy Crush each region's top row, or a marked cell, spawns candies; an island with no spawner and no teleporter is a closed puzzle that only ever loses tiles (recall). Designers keep it playable by (a) giving every region a spawner or a teleporter exit, (b) keeping every region at least 3 wide so a match is possible, (c) bot and playtest checks.
- Playability rule of thumb: every region must have at least one legal move at start and after refill. Override's `reshuffle` already covers the "no move" case.

## 2. Teleporters and portals

- Rules (verified from a community guide, [Candy Crush help blog, Teleports](https://candycrushsagaallhelp.blogspot.com/search/label/Teleports)):
  - A teleporter links an exit on one cell to an entrance on another. It does not occupy a cell; it is a portal that carries a candy between the two points.
  - Entrance and exit are often directly above and below each other in the same column. Harder boards use long routes (level 137), or routes that loop so "lower down" can mean "above" on screen (level 76).
  - Candies pass through. On ingredient levels, ingredients pass too.
  - Special candy effects (a line blast) do not travel through a teleporter; they cross the screen normally and ignore the portal.
  - To pull something through you need a match lower down, so the cascade drags it through.
- Pairing (verified, search summary): each entrance has exactly one exit, and portals are drawn as coloured pairs (blue entrance, pink exit). Dreamworld conveyor teleporters used matching letters to show entry and exit ([wiki, Level 503 Dreamworld](https://candycrush.fandom.com/wiki/Level_503/Dreamworld)).
- Direction is one-way: entrance on the bottom edge of a cell, exit at the top of another (recall).
- Matches across a portal: not covered by any source we found. From play (recall), the falling candies are connected for gravity only; a match is made of adjacent board cells, so a line does not span a portal. Treat as unverified; we can choose the simpler rule (no match across) and say so in the rules.
- Typical layout, the "snake": a board of separate columns or bands where each column bottom teleports to the next column top, so one long path carries ingredients or candies across the whole board (recall). Another is a ring: bottom of the left side teleports to the top of the right side.
- Portal-like cousins: conveyor belts that shift a row or column of candies one step each move (Soda, Dreamworld; recall, wiki mentions conveyor teleporters only in passing); cannons that fire into a region; rotating or moving blockers.
- Community tip (verified, fan wiki): an ingredient inside a teleporter column is hard to settle, so players swap it into a different column ([wiki file, level 95 strategy](https://candycrush.fandom.com/wiki/File:Level_95_strategy.png)).

## 3. Ingredient (drop) goals

- Goal: bring N ingredients (cherries, hazelnuts) to the exit. Hazelnuts were phased out by 2022 because they were functionally the same as cherries ([TV Tropes](https://tvtropes.org/pmwiki/pmwiki.php/VideoGame/CandyCrush), verified).
- Exit: usually the bottom row, but later levels mark exit cells with arrows or a different floor, even in the middle of the board (recall; "other specific locations" confirmed in search summary).
- Spawn: ingredients come from marked dispenser cells, usually in the top row, at a fixed schedule or a fixed count, not random every refill. Some levels start with the ingredient on the board in a corner (top-left, exit on the far side) (recall). The fan wiki shows magenta lines marking where candies and ingredients spawn ([fan wiki](https://candy-crush-saga-fanon.fandom.com/wiki/File:CCR_Level_227_V2_Notes.png), verified as fan-made).
- Swapping: an ingredient is a normal swappable piece. A swap that moves it is legal even with no match (it is a free-form move that costs a move) (recall; a fan note says ingredients "need to be switched once or twice", verified anecdotally). It is not cleared by matches or specials, only by reaching the exit.
- Interaction: ingredients travel through teleporters (verified). Blockers that never move (licorice, locks) stop it falling; it must be swapped sideways. Conveyors carry it (recall).
- Common patterns: ingredient starts top-left, exit far side with a wall between, so it must be walked sideways; two ingredients in separate columns; ingredient on top of a layered blocker; ingredient plus a jelly or score goal.

## 4. Spawn control

- Spawners are per cell or per column. Columns or regions can have no spawner, so they do not refill (recall).
- Candy cannons are the dispensers: a cannon sits on a top-row cell and emits a specific item (ingredient, bomb, blocker) on a schedule or when the cell below is empty. Some emit blockers, which makes a level a race (recall). Mal-O-Matic, a newer blocker, is cited as introduced gradually so the team can gather data ([PocketGamer.biz](http://www.pocketgamer.biz/crafting-candy-crushs-difficulty-blockers-level-design-ai-and-the-complexity-staircase/), verified).
- Related lever: refill weights. Our `refillWeights` is already this lever at colour level.

## 5. Set pieces and archetypes

These names are ours; the patterns are common across the games (recall, supported in part by [Gamigion](https://www.gamigion.com/match-3-level-design-principles/) and [PocketGamer.biz](http://www.pocketgamer.biz/crafting-candy-crushs-difficulty-blockers-level-design-ai-and-the-complexity-staircase/)).

- Walled island: a small region behind blockers holding the goal (jelly, ingredient exit, bombs). You must open a path.
- Special-only blockers: layers that a plain match cannot break (several hits, or only a blast). Forces building specials.
- Unlock layout: goal cells locked until a key condition (clear a ring, bring an ingredient to a switch).
- Layered blockers: the same blocker with 1 to 4 hits. Levels grind it down; King notes harder levels favour blockers that force decisions over simple layers ([PocketGamer.biz](http://www.pocketgamer.biz/crafting-candy-crushs-difficulty-blockers-level-design-ai-and-the-complexity-staircase/)).
- Funnel: wide top narrowing to one or two columns at the bottom; everything must pass the gap.
- Bottleneck: a one or two cell gap between two regions; hard because moves there are scarce.
- Frame or ring: goal cells around the edge, centre blocked.
- Snake or zigzag: teleporter chain (see 2).
- Split board: two halves joined only by teleporter or an ingredient route.

## 6. Layout as a difficulty lever, and pacing

- Layout levers with no change to rules (recall plus the sources above): fewer colours; narrower board; more or tighter chokepoints; goals far from the spawn; more blockers or more layers; islands that need specials; fewer legal moves at start; goals that need a path opened first. King says difficulty at depth comes from "intricate objectives, tighter constraints and complex layouts rather than simply more blockers" ([PocketGamer.biz](http://www.pocketgamer.biz/crafting-candy-crushs-difficulty-blockers-level-design-ai-and-the-complexity-staircase/)).
- Pacing: difficulty is varied on purpose, not a straight ramp; a hard level is often followed by a lighter one (same source, verified). Reports of a King GDC talk say levels alternated easy and much harder to make difficulty rise and fall ([search summary, pocketgamer.biz "king on finding the fun"](https://www.pocketgamer.biz/king-on-finding-the-fun-in-candy-crush)). Candy Crush marks "hard" and "super hard" levels in the map (recall). Guides recommend a sawtooth with a breather after each spike and a new mechanic introduced alone before it is combined ([bugnet](https://bugnet.io/blog/difficulty-curves-how-to-get-them-right)). Override already does this (`difficulty` +.1 on every 5th level, -.1 after).
- New blockers follow a complexity staircase: simple ones early, interacting ones for veterans, each new blocker must earn its place with a distinct behaviour.
- Swap-based control is harder than tap-based, and special pieces change difficulty; fewer specials early ([CoG 2024 RoyalCrush paper](https://downloads.hci.informatik.uni-wuerzburg.de/2024-CoG-RoyalCrush.pdf)).

## 7. Procedural generation and bots

- King uses bots for difficulty estimation: MCTS, heuristic agents, NEAT, then a CNN agent trained on human play that predicts level difficulty with better correlation to real pass rates than MCTS and much less compute ([Gudmundsson et al. 2018, Human-Like Playtesting with Deep Learning](https://www.Gwern.net/doc/reinforcement-learning/imitation-learning/2018-gudmundsson.pdf); [StickyMinds talk](https://www.stickyminds.com/presentation/using-artificial-intelligence-test-candy-crush-saga-game); [Computer Weekly](https://www.computerweekly.com/news/252456896/How-TensorFlow-makes-Candy-Crush-virtual-players)). Playtesting a level by hand took about a week; the bots cut feedback to minutes. A KTH thesis also used MCTS to predict human success rate ([KTH thesis](https://openaccess.library.uitm.edu.my/Record/ndltd-UPSALLA1-oai-DiVA.org-kth-206595)).
- Generated vs hand-made at King: bots simulate plays, flag outliers, predict pass rates and generate draft levels; designers choose objective, target difficulty and feel, and make the final call ([PocketGamer.biz](http://www.pocketgamer.biz/crafting-candy-crushs-difficulty-blockers-level-design-ai-and-the-complexity-staircase/)). A level takes days to weeks from idea to release ([PocketGamer.biz, spectrum of flavours](http://www.pocketgamer.biz/competitive-or-casual-designing-candy-crush-with-a-spectrum-of-flavours/)). Layouts are hand-made.
- Academic: EA SEED generates layouts with a conditional VAE steered by difficulty stats, validated by bots using move count as the difficulty proxy ([arXiv 2409.06349](https://arxiv.org/pdf/2409.06349), from search summary; PDF not read). modl.ai describes bots reporting moves, time and reshuffles on generated levels ([modl.ai](https://modl.ai/?p=400)).
- Not found: any public King talk on fully procedural layout generation. Treat template plus parameters as our own design, not an industry standard.

## What this means for Override

Override already has: holes in nothing yet (rectangles only), encrypted cells and firewalls (layered blockers), a bot that sets the move limit, a sawtooth, diagonal fill, and a seeded refill. Layout is the biggest missing lever.

Build order, cheapest and highest value first:

1. **Board masks (holes).** Add `mask` to the attempt: cells that are void (no tile, no match, no gravity). Gravity already skips cells it cannot fill; void cells act like a permanent roof. Start with a small library of symmetric masks (notched corners, hourglass, diamond, frame, columns of unequal height), chosen by `hash(level, 2)` and difficulty. Mask index and salt go in `S`, so saves stay JSON-safe. Check at generation: every region has 3 or more cells in a row somewhere, and a legal move exists.
2. **Mask-aware encrypted and firewall placement.** Place them inside the template (for example a walled centre) rather than random mirrored pairs. This gives the frame, funnel and bottleneck archetypes for free.
3. **Spawner rules.** Mark which top-row cells spawn. A cell with no spawner and no feed from above stays empty or gets a teleporter exit. Required before islands. Keep the rule that regions always refill from a spawner, so the bot never faces a dead island.
4. **Drop goal (ingredients).** New goal kind `drop`: N tokens spawn from a dispenser schedule (or start on the board), are swappable tiles that match nothing, and leave at the exit row or marked cells. A swap with a token is legal without a match and costs a move. (Owner’s ruling for Override: a drop swap is legal only when it makes a match for the other tile.) This is the single best use of layouts (far side exit, walled gap, funnel). It needs the bot's `pick` to value token progress (distance to exit) or it will not finish; add a progress term.
5. **Portals.** One-way pairs: bottom of a cell in column A drops into the top of a cell in column B. Gravity treats the exit as the cell above the entrance. Tokens and plain tiles pass; specials and blast areas do not use the portal (matches King's behaviour, verified for line blasts). No matches across a portal, to stay simple and fair; state it in the spec. Layout templates: snake and split board. Add a visible marker pair in the canvas, colour-coded plus a glyph for accessibility.
6. **Islands.** Only after 3 and 5, and only with a spawner or portal exit per island. Verify with the bot over many seeds that no island is dead.
7. **Conveyors, cannons that emit blockers.** Later; each is a new behaviour that must earn its place, as King puts it.

How the generator should work: a library of hand-drawn templates (a string grid of `.` void, `#` normal, `S` spawner, `E` exit, `a>b` portal, plus tags such as `walled`, `funnel`, `split`). `makeAttempt(level, fails, salt, drop)` picks a template by difficulty band and `hash`, then fills goals and blockers from the existing parameters. Rotate and mirror templates for free variety. Hand-draw 15 to 25 templates (roughly 3 to 4 per archetype); do not try to generate shapes procedurally, because King itself keeps layouts human-made and bots check them. Add one new mechanic per chapter, introduced on an easy level and a breather, then combined later. The bot's `prepare` already loops salts and drops difficulty; extend it to drop to a simpler template tier when no salt passes, and have `tools/sim.mjs` print the template name so balance runs show which layouts are outliers. Add a test that every template yields at least one legal move and that all regions are fed.

Keep the layout difficulty on the same dial: `d` picks the template band (open shapes at low `d`, bottlenecks and islands at high `d`), and the bot's median move count sets the limit as today.
