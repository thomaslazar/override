# Override board layouts, teleporters and drop goals: design

Date: 2026-11-14. Status: approved in principle by the owner (2026-11-14); builder-check calls marked below. Branch `feat/board-layouts`. Replaces roadmap items 1
(board layouts), 2 (drop goal) and 3 (teleporters and islands) with one feature. Extends the core
loop spec; everything there still holds unless this file says so.

## Intent

Every level today is a square of 7 to 9 cells with encrypted cells in random mirrored pairs and
firewalls on random cells. Levels look alike. The owner wants variety in level design: some boards
simply nicer to look at, others tougher to play. Override stays procedural and endless: no hand-made
levels. What grows over time is a library of board templates.

Square boards stay. Templates are one more kind of level next to them, not a replacement.

## Goals

1. **Geometry:** boards can have holes (cells that are not there) and unbreakable blocks (solid
   pieces that never go away). Both make shapes: notched corners, an hourglass, pillars, a wall
   across the middle.
2. **Spawners anywhere:** tiles can enter at marked cells anywhere on the board, not only the top
   row. A board cut in half by a wall gets its own spawners for the lower half.
3. **Teleporters:** one-way pairs. What falls out of the bottom of the ingress cell comes in at the
   top of the egress cell. Placed freely: under each other, mirrored (fall in on the left, come out
   on the right), crossing, chained so a whole board becomes a snake.
4. **Drop goal:** drop tiles (data drives, keycards and so on) that never match, enter from
   spawners, and leave the board at drop points. A level can ask for several kinds.
5. **Templates:** a library of whole-board templates picked per level by difficulty and seed,
   mirrored for variety. Square boards keep their place and gain blocker patterns.
6. **Fair:** every board is played by the bot, which sets the move limit as today. No dead regions,
   no unwinnable boards.

## Non-goals

- Hand-made levels. Never.
- Layered generation (approach B below). Later, if templates start to feel repetitive.
- A drop point per drop kind. Later, on the roadmap.
- Blocks that stop blasts. A mechanic to try out later, on the roadmap.
- New breakable blockers (ICE, logs, trace and the rest stay roadmap item "More blockers").
- Intro cards for the new pieces (the NPE item covers that).

## Anti-goals

- A board with a part that never gets tiles, or a drop tile that can never reach a drop point.
- Boards that look accidental. A template is drawn on purpose; the generator never invents shapes.
- Teleporter routes the player cannot read: where a tile goes must be visible on the board.
- Level preparation slow enough to feel (see Constraints).

## Approaches

- **A. Whole-board templates (chosen).** Each template is a small text grid holding everything about
  a board: holes, blocks, spawners (with a drop kind if any), teleporter pairs, drop points. A level
  picks one by difficulty and seed, may mirror it, then fills goals, blockers and tiles as today.
  Every board looks intended, a new template is one grid to add, the bot checks each one. Variety
  grows with the template count.
- **B. Layers (later).** Separate small libraries (shape, flow of spawners/teleporters/drops,
  blocker pattern) combined where they fit, then validated. Far more combinations, but many look
  accidental and need compatibility rules. Kept for later.
- Fully random boards (walls and teleporters by dice): dropped, messy and hard to keep fair.

Square boards get **blocker patterns** as the one free layer (it fits any board): ring, wall, cross,
diagonal, and today's random mirrored pairs.

## Design

### Board model (`src/core.js`)

A board has, besides tiles and encrypted cells, static per-cell features that never change during an
attempt. They live in `S` as JSON-safe arrays so saves carry them; a save without them is a plain
square board (old saves keep working).

- **Dead cells:** `hole` or `block`. Same rules, different look. A dead cell never holds a tile,
  never fills, is never matched, and roofs the cells below it for gravity (like an encrypted cell
  today). Matches cannot run across it (it holds no tile). Blasts of worms, bombs and zero-days pass
  over it: a worm still clears the rest of its row and column, a bomb the rest of its square.
- **Spawners:** marked cells. When a spawner cell is empty during gravity, a new tile appears there
  (today's top-row spawn, generalised). A spawner may carry a drop kind (see drops); it then spawns
  only that drop kind when a drop is due, else normal tiles. With no spawners in the template, every
  live cell of the top row is a spawner (today's behaviour).
- **Teleporters:** pairs (ingress cell, egress cell), one way. The bottom edge of the ingress and the
  top edge of the egress are linked: for gravity the ingress is the cell above the egress. So the
  cell below the ingress is no longer fed from it, and the cell above the egress no longer feeds
  it. Tiles, specials and drop tiles pass through. Matches and blasts do not reach across a
  teleporter (they use board adjacency only). An egress may not also be fed from its own column.
  Several pairs per board.
- **Drop points:** marked cells. A drop tile that comes to rest on a drop point leaves the board (see
  drops).
- Gravity: straight down, through teleporters, diagonal fill for unfed cells (as today), spawn at
  spawners. Today's settle-time damping (`DAMP`) applies to spawner refills as it does now.
- `fed(S, i)` (straight feed) becomes "reaches a spawner or a teleporter egress by going up without
  passing a dead cell, encrypted cell or firewalled tile", following teleporters upwards. Cells that
  are not straight-fed still fill by diagonal slides, as today.

### Drop tiles and the drop goal

- A drop tile is a tile with a drop kind and no colour. Two or three kinds in the fiction (for
  example data drive, keycard, planted device; final names and glyphs are the builder's, all text in
  `lang/en.json`). Drawn as distinct pieces with a glyph, not colour alone.
- Never matches, is never a special, cannot be destroyed: no wave clears it, no blast, no zero-day.
  Blasts clear the tiles around it and so make way for it.
- **Swap rule (owner):** a drop tile can be swapped with a neighbouring tile only when the swap makes
  a match for that other tile. That is how drops move sideways and up. A drop tile never swaps with
  another drop tile. (Builder-check call: a special swapped with a drop tile follows the same rule:
  legal only if the special lands in a match; no combo with a drop.)
- **Falling (builder-check call):** drop tiles fall exactly like tiles, diagonal slides included, so a
  drop under a hole or block can still slide past it.
- **Leaving:** when gravity settles, every drop tile on a drop point leaves the board (a step
  `{ k: 'exit', i, id, kind }`), counts for its goal and the cell refills. Any drop point takes any
  kind (owner).
- **Goal:** `{ kind: 'drop', d: <drop kind>, need, got }`. A level can have one goal per drop kind,
  so "2 data drives and 1 keycard" is two goals. Drop goals can sit next to tile, crack and firewall
  goals; the three-goal cap stays.
- **Arriving:** from spawners. A level's drop schedule is either `every N moves` or `after` (the next
  one comes once the previous left the board). When a drop is due, the next refill at a spawner that
  allows that kind spawns it instead of a normal tile. Never more drop tiles on the board than the
  goals still need (owner). A template may also place drop tiles on the board at the start.
- **Spawners per kind (owner):** a spawner may be limited to one kind, so two kinds enter in
  different parts of a split board.
- Reshuffle: drop tiles, dead cells and features stay where they are; only coloured movable tiles
  shuffle.
- Finale: drop tiles are untouched; a won level's drops simply stay.
- Score: a drop tile leaving scores `SCORE.exit` (start at 200, tune), flat (no chain factor; planner call), unlike
  other points.

### Templates (`src/layouts.js`, new, pure)

- A template is a text grid (7 to 9 square, as boards today) plus metadata: `name`, a difficulty
  band (`dMin`, `dMax`), tags (`shape`, `walled`, `split`, `teleport`, `drop`, `snake`, `funnel`),
  whether it may be mirrored, and for drop templates the drop kinds and schedule. Legend (builder's
  exact characters): live cell, hole, block, spawner (optionally with drop kind), teleporter ingress
  and egress (paired by letter), drop point, optional blocker zone (cells where encrypted cells and
  firewalls may go).
- A template does not hold tiles, goals or blocker counts; the level fills those from its
  parameters as today. Encrypted cells and firewalls go into the template's blocker zones (or any
  live cell if it has none).
- **First library (builder's to draw, 14 to 18 in all):** about 5 shapes (notched corners,
  hourglass, diamond, frame, pillars); 3 to 4 geometry and spawner boards (a wall across the
  middle with spawners for the lower half, a walled pocket); 3 to 4 teleporter boards (column
  snake, mirrored crossing, split halves fed by teleporter); 3 to 4 drop boards, including the
  owner's two examples:
  - **Corner run:** spawner top left, drop point bottom right, every other top cell an egress and
    every other bottom cell an ingress, each column's bottom ported to the next column's top, so a
    drop snakes across the whole board.
  - **Mirrored funnel:** spawners top left and top right, two drop points bottom middle, teleporters
    funnelling both sides together.
  The research gallery (`docs/research/2026-11-11-layout-gallery.md`) has 26 candidates to draw from.
- **Validation (a test over every template, both mirrors):** every live cell can get a tile, by
  straight feed or diagonal slides (builder-check call: diagonal slides count, so pillars, notches
  and diamonds need no extra spawners); every drop
  spawner can reach a drop point (following gravity, teleporters and sideways swaps); every
  teleporter pair is complete and one way with no loop; the board has at least one legal move after
  filling.

### Level generation (`src/levels.js`)

- Per level, from `level` only (builder-check call): the kind of board (square or template), the
  template and its mirror, the blocker pattern for squares. `salt` moves blockers within the board
  as today, so a failing salt never silently swaps a level's template.
- Blockers on a template (builder-check call): encrypted cells and firewalls go only into blocker
  zones and never on a spawner, teleporter cell or drop point. A pocket they roof is fine (they
  break); only dead cells may cut a part off for good, and validation covers those.
- **Mix and pacing (my call, tune by playtest):** square boards stay the majority early and about
  half later. Templates enter in this order, each first on a breather (chapter positions 6, 11, 16,
  21, 26): shapes and geometry from level 11, teleporters from level 16, drop goals from level 21. In later chapters
  everything mixes. Every 5th level (the spike) prefers tougher tags (`walled`, `split`, `funnel`).
- Changed in testing (owner, 2026-11-15): no template again within the last 5 template boards while
  the pool has others; a mirrored template alternates sides on each use. A board split in halves
  (split, wall) has an odd size so the split sits in the middle (wall is 9 x 9 now). Holes are drawn
  as faint hatching, so off-board areas read as such and not as empty black.
- Blocker patterns on squares: ring, wall row, cross, diagonal, random mirrored pairs (today), by
  level. Builder-check call: patterns apply to every square level with blockers, so those levels
  get new boards and the bot sets new limits for them; square levels without blockers keep their
  boards and limits.
- `makeAttempt` puts the template's features into `S`, places blockers into its zones, fills tiles
  from the deal, and adds drop goals for drop templates (need 1 to 4 per kind by difficulty).

### Bot and limits (`src/bot.js`, `tools/sim.mjs`)

- The bot plays every board as today and sets the limit from its median. Square levels must come out
  unchanged.
- For drop goals the bot's `value` gains a progress term: for each drop tile on the board, how far it
  is from a drop point along the flow (gravity, teleporters, swaps), so a move that brings a drop
  closer scores better. Without it the bot cannot finish drop levels and their limits are nonsense.
- Fallback order when no salt passes (builder-check call): first ease `drop` on the same template, as
  today; then a template of a lower band; then a square board.
- `tools/sim.mjs` prints the board kind and template name per level.

### UI (`src/ui.js`, `style.css`, `lang/en.json`)

- Holes: no cell background (the board edge follows the shape). Blocks: a solid drawn piece, clearly
  not a tile and not an encrypted cell.
- Spawners: a small mark on the top edge of the cell, only where they differ from "the top row
  spawns".
- Teleporters: a marked pair, ingress mark on the bottom edge, egress mark on the top edge, with the
  same glyph or letter and colour on both, so a pair is readable without colour too.
- Drop points: a mark on the bottom edge of the cell (an arrow out of the board).
- Drop tiles (owner): visually distinct from every tile you can pop. Not the rounded coloured tile
  with a katakana glyph: a different silhouette (for example a drawn object such as a drive or
  keycard, or a framed hardware piece), its own look per kind; a short effect when one leaves.
- HUD goals: one counter per drop kind with its piece.
- The fall animation already plays gravity passes; a tile going through a teleporter disappears down
  at the ingress and drops in at the egress.

### Saves and play log

- `validSave` accepts the new features and the drop tile and drop goal shapes; old saves load as
  square boards.
- The play log records the board kind and template name per attempt; `tools/plays.mjs` groups by it.

## Stages (one branch, owner tests after each)

1. **Geometry and spawners:** dead cells, spawners anywhere, blocker patterns on squares, the first
   shape and geometry templates, bot and sim support, drawing.
2. **Teleporters:** rules, drawing, teleporter templates.
3. **Drop goal:** drop tiles, drop points, schedule, bot progress term, drop templates including the
   owner's two examples.

Each stage ends with all tests green, the sim run, and the dev server showing it. The branch merges
only when the owner is content with all three.

## Constraints

- Vanilla ES modules, no dependencies, no build step. No `Math.random` in `src/`.
- `src/core.js`, `src/levels.js`, `src/layouts.js`, `src/bot.js` stay pure.
- Preparation: the sim's per-level `ms` (fails 0, desktop Node) stays under 1.2 s for levels 1 to 60
  and the median under twice today's (today about 260 ms).
- Square levels without blockers keep their boards and limits; square levels with blockers get the
  new patterns and new bot limits; template levels are new.
- Saves stay compatible; new `S` fields are optional.
- No em-dashes in copy or docs; typographic apostrophes in visible text.
- `docs/architecture.md` describes the board model, templates, teleporters and drops; `ROADMAP.md`
  merges items 1 to 3 into this feature and adds "drop point per kind", "blocks stop blasts" and
  "layered generation (B)" as later ideas.

## Left to the builder

- Data shape of the features in `S` and the template legend characters.
- Drawing of holes, blocks, spawner, teleporter and drop point marks, and drop tile pieces.
- The drop tile kinds' names and glyphs.
- The exact templates in the first library, within the counts above.
- How the bot measures drop distance, as long as the sim shows it finishes drop levels.

## Testing

- Core: dead cells (no fill, no match across, roof gravity, blasts pass over); spawners mid-board
  refill a cut-off lower half; teleporters (a tile leaving the ingress arrives at the egress, the
  cell below the ingress is fed only otherwise, blasts and matches do not cross); drop tiles (no
  match, not cleared by any blast, the swap rule both ways, leaving at a drop point counts the goal,
  never more on the board than needed, schedule `every` and `after`); reshuffle leaves features and
  drops in place.
- Templates: the validation test above over every template and mirror.
- Levels: same level, salt and drop give the same board; square levels unchanged.
- Bot: wins every template in the sim within the cap; square limits unchanged for a sample.
- Saves: new fields round-trip, old saves load.
- Browser: one board of each kind at 402 x 706 and 375 x 548.

## Builder notes

- Encrypted cells in a small blocker zone (under 2n cells, a walled pocket) take one hit. With multi-hit
  cells such a pocket made levels far too long: few matches reach it, so the pocket stalled the level.
- Each template carries an `effort` factor on its blocker counts and tile goals. Walled and split boards
  (wall, pocket, split) give few cascades and a small board (notch) has few cells, so without it their
  levels ran 1.5 to 3 times the effort target `8 + 14 d`. A template level with only a few blockers
  (fewer than n) always gets a tile goal too, so it is never near free.
