# Cred, gear, tools and rockets

Status: approved by the owner, 2026-11-18. Branch `feat/funds-shop`.

## Why

The owner keeps meeting two moments where a little help would turn a loss into a win:

- one or two goal pieces left and the moves run out by one turn: a hammer would have won it;
- a drop one lane away from its drop point: a free swap would have moved it over.

And some levels are genuinely hard: played two or three times, an edge at the start (a few specials already
on the board, a few extra moves) would get the player through and on with the game.

So the game gets a currency earned by winning (cred), a stock of gear and tools that grows from loot and from
buying, gear taken into a level from the level start screen, and tools used during a level. The owner wants it
generous: "I'd rather they have too much gear than none at all. The game should be fun, and winning is fun."

Rockets come in the same piece: a fourth special made by a 2 x 2 square, which flies to targets that matter.

## Goals

- **Cred** (symbol ₡), earned only by winning, from the level score.
- **Stock** of gear and tools, no cap; filled by a starter set, loot and the shop.
- **Loot:** some levels carry a reward item, paid on the first win.
- **Shop** on the level start screen: buy any item any time between levels.
- **Gear:** each level offers three gear kinds; switch any of them on for the next try, from stock or paid in cred.
- **Tools** during a level: hammer, swap, shuffle. No move cost; not when moves are at 0.
- **Rockets:** a 2 x 2 square of one colour makes a rocket; it fires small rockets at targets.

## Non-goals

- Buying anything with money. Ever.
- Offers on the loss screen (owner: "either I notice myself and act on it, or I lose").
- Buying during a level (only between levels, on the start screen).
- A stock cap (owner: none for now; revisit only if play shows hoarding).
- Other new specials from the research (`docs/research/2026-11-18-specials-and-boosters.md`): later.
- A "cracked start" gear item (owner does not like it).
- Changing failure easing or the bot's move limits because of gear.

## Anti-goals

- A level that needs gear. Every level stays beatable without gear: the bot plays without it, gear and tools
  only make a level easier.
- Farming: replaying a won level pays only what beats the best score.
- Starving: a player who meets a hard level should normally own something to bring.
- Tools that cost a move, or sneak a move in after the last one.

## Approaches

- **A. Gear and tools as pure rule functions, applied after preparation (picked).** The worker prepares an
  attempt exactly as today (the bot sets the limit without gear). At Start, `applyGear(S, gear)` places the
  specials and adds moves; tools are `tool(S, kind, a, b)` in the core, like `move`, returning steps the UI
  animates. Cred and stock live in a new storage key. The bot, the sim and level preparation stay untouched
  (apart from rockets, which are a rules change everyone sees).
- B. Gear baked into the attempt (the worker prepares a geared attempt). Rejected: the limit would be set with
  gear, so gear would not make a level easier; also one preparation per gear combination.
- C. Tools as UI-only edits of the state. Rejected: untestable, and the play log and save would not see them.

## Design

### Cred

- Name **cred**, symbol **₡**, drawn in code (a C with two vertical strokes) as a small inline icon, because the
  self-hosted fonts are Latin subsets without U+20A1. Shown as `₡ 312`.
- **Payout on a win:** `floor(score / 100)` on the first win of a level; on a replay, `floor((score - best) / 100)`
  when the score beats the previous best, else 0. (Play log: a typical win scores about 3,800, so about ₡ 38; weak
  wins about ₡ 10, great ones about ₡ 150; the median is flat across levels 1 to 158.)
- Losses pay nothing.
- Paid exactly once per win: the win screen pays and stores best score and cred in the same step, so a reload of a
  won level pays nothing again.
- Shown on the start screen, in the shop and on the win screen (`+ ₡ 38`, and loot as "{item} added").

### Stock, starter set, prices

- Items (ids for code, names working names in `lang/`):

  | id | kind | what | price |
  |---|---|---|---|
  | `worm` | gear | a worm on the board at the start | 40 |
  | `bomb` | gear | a logic bomb on the board at the start | 50 |
  | `rocket` | gear | a rocket on the board at the start | 40 |
  | `zero` | gear | a zero-day on the board at the start | 100 |
  | `moves` | gear | extra moves (3, 4 or 5, by level) | 60 |
  | `hammer` | tool | break one cell | 60 |
  | `swap` | tool | swap any two neighbours | 80 |
  | `shuffle` | tool | reshuffle the board | 30 |

- No cap. Starter set for a new player (and for an existing save that has no stock yet): 2 worms, 1 bomb,
  1 rocket, 1 hammer, 1 shuffle (builder may tune).
- Start over is a full reset: level 1, no best scores, the starter stock and ₡ 0 (changed after the first playtest, so the economy can be tested from zero). Settings and the play log stay.

### Loot

- Some levels carry one reward item, drawn from the level only (seeded; the same on every try).
- Chance: always on every 5th level of a chapter and the chapter's last level; 35 % when the level's
  difficulty is in the top third of its chapter; 10 % otherwise. (Roughly one item every 4 to 5 levels.)
- Which item: weighted; shuffle and worm most common, zero-day rarest; rocket only from the level rockets can
  appear (from level 1, see Rockets).
- Shown on the start screen ("Loot on first win: hammer"), paid on the first win together with the cred.
  Not on replays.

### Gear on the start screen

- Each level offers **three gear kinds** from `worm`, `bomb`, `rocket`, `zero`, `moves`, drawn from the level only
  (same on every try). `moves` gives 3 to 5 moves, also by level.
- Each slot shows the item, how many the player owns, and an on/off state. Switching on a slot the player owns
  uses one from stock; switching on one the player does not own shows its price and is paid from cred (only if
  the cred suffices). At most one of each offered kind per try.
- Paid and taken from stock when Start is pressed, not before (a reload on the start screen loses nothing).
- `applyGear(S, gear)` (pure, `core.js`): each special goes on a random plain tile (no special, no drop, no
  firewall, not encrypted), seeded from the attempt, so the same deal gets the same cells; worm direction
  seeded; extra moves add to `S.moves` and `S.limit`. The board after placing must not hold a match (a placed
  special keeps its tile's colour, so it cannot create one).
- The attempt records the gear used (save and play log).

### Shop

- On the start screen, a Shop button opens a list: icon, name, one-line effect, owned count, price, Buy. Buying
  takes cred and adds one to stock. Buying works only between levels (the start screen), never mid-level.
- Also reachable from the start screen only (not the menu), so it is clearly "between levels".

### Tools during a level

- A small tool bar under the board (in the soft-key row): hammer, swap, shuffle, each with its count. Hidden
  counts of 0 show dimmed. Disabled while moves are 0, while the board animates, and after the level ends.
- Tap a tool to arm it (tap again to disarm). Then:
  - **hammer:** tap a cell. A plain or special tile is cleared like a blast hit (it counts for goals, a special
    fires); a firewalled tile is unlocked (the tile stays); an encrypted cell loses one layer. Not on a drop, a
    hole, a block or an empty cell.
  - **swap:** drag or tap two neighbours: they swap without needing a match, drops included. If the swap makes
    matches or brings two specials together, it resolves like a normal move (combo rules included). Firewalled
    tiles cannot be swapped.
  - **shuffle:** shuffles at once (the existing reshuffle: drops stay put).
- None costs a move. After the tool, gravity and cascades run as usual; if no move is left on the board, the
  usual free reshuffle follows.
- Rules: `tool(S, kind, a, b)` in `core.js`, pure, returns `{ ok, steps }` like `move`; refuses when moves are 0
  or the level is won. Used one from stock only when `ok`.
- The play log records tool uses.

### Rockets

- **Made by** a 2 x 2 square of one colour (a new match shape: today only lines of 3 or more match). A square
  that is also part of a longer line or an L/T makes the stronger special: zero-day, then bomb, then worm, then
  rocket. Placement: the swapped cell when in the square, else a square cell (seeded or first).
- **Colour:** a rocket has its tile's colour, like worms and bombs. It matches by colour in normal matches (and
  fires when matched or swapped). The colour matters for combos with a zero-day.
- **Fires** 3 small rockets. Each picks a target, all different, seeded, in order of preference: firewalled
  tiles, encrypted cells, tiles of a colour a tile goal still needs, the tile directly under a drop (helps it
  fall), then any tile. Never a drop, a hole, a block, or a cell the same wave already clears. Each target is hit
  like a blast hit (clears, unlocks or cracks one layer). Rockets fly over holes, blocks and teleporters (the
  board's adjacency rules do not limit them).
- **Combos** (two specials swapped):
  - rocket + rocket: 8 rockets.
  - rocket + worm: 3 rockets fly to good targets and each sets off a worm there (direction seeded).
  - rocket + bomb: 3 rockets fly to good targets and each sets off a bomb there.
  - rocket + zero-day: every tile of the rocket's colour turns into a rocket, then all fire (like zero-day + worm).
- Rockets appear from level 1 (they come from ordinary matches). The bot uses them like any special (it plays
  through the core). Gear `rocket` places one.
- **Matching code:** findGroups, valid move search, the "no line" checks used by filling, damping and refills,
  and the move hint all learn the square. A freshly dealt board has no square either.
- Drawn in code in the terminal style (a small rocket glyph in the tile's colour); the flight is a short
  streak from the rocket to each target before the hits pop.

### Balance

- Rockets make specials more common; the bot sets limits by playing, so limits follow. Re-run
  `node tools/sim.mjs 1-150` and keep the median ratio near today's (about 100 %) and prepare time near today's
  (median about 0.45 s, at most about 3 s); adjust `K`/`C` or effort only if it drifts far.
- Gear and tools never enter the sim.

### Saving and keys

- New key `override-deck`: `{ cred, items: { worm, bomb, rocket, zero, moves, hammer, swap, shuffle } }`
  (missing key: the starter set and ₡ 0). Validated on load like the other keys.
- The attempt save (`override-v1`) gains `gear` (the ids used) where needed; `validSave` accepts it and the
  rocket special `'r'`.
- Start-screen state (the gear switched on but not yet started) is not saved; a reload shows the slots off.

### Text and look

- All visible text in `lang/en.json`: item names and effects, Shop, Buy, Owned, Loot, cred amounts, tool bar
  labels for screen readers. No em-dashes, typographic apostrophes.
- Item icons drawn in code like the board pieces (gear shows the special as on the board; tools get simple
  terminal-style icons).

### Docs and tests

- `docs/architecture.md` with the code; `CLAUDE.md` gets the new key; `ROADMAP.md` marks the item done.
- Tests: payout (first win, replay above best, replay below, loss), loot and gear offers seeded and stable across
  tries, `applyGear` (cells legal, no match created, moves added, same deal same cells), each tool (legal and
  refused targets, no move spent, goals counted, refused at 0 moves), rockets (square found, priority over
  lines, targets in preference order and distinct, never a drop, each combo), `validSave` with `gear` and `'r'`,
  the deck key validation.

## Settled after the builder check (my calls)

- Rockets in matches follow the worm and bomb rules exactly: a rocket in any match group fires.
- Squares and lines: groups that share a cell merge into one group (as runs do today) and make one special,
  the strongest it qualifies for; a square that shares no cell with a line is its own group with its own rocket.
- `tool` ends like `move`: gravity, cascades, the win check (a tool can win the level; the finale follows), the
  free reshuffle when no move is left. A tool never spends a move, so it can never lose the level.
- A free swap that makes no match and no combo stays swapped (no revert); the tool is used.
- Saving: after a tool the state is saved like after a move (the board itself is saved, no replay); the stock
  change is saved in `override-deck` at the same time.
- A retry after a loss shows the gear slots off again: gear is chosen (and paid) per try.
- A level with no stored best score counts as a first win (cred and loot). Old saves from before the level score
  may pay a level once more; accepted.

## Left to the builder

- The rocket glyph and flight look, the cred icon, the item icons, the start-screen and shop layout (within the
  existing sheet style), the tool bar layout.
- Loot weights, the starter set, the exact "top third of the chapter" test.
- How the swap tool takes its two cells (tap-tap or drag).
- Whether to split the work into stages (suggested: cred, stock, shop, loot; then gear and tools; then rockets).

## Changed in building

- Balance: rockets made levels clear faster (sim median ratio 100 % fell to about 70 %). Tile goals grew instead of
  touching the bot's `K`/`C`: `GOAL` 1.2 to 1.8 brings the median back to 100 %. Levels with only blocker goals (about
  49 %) and drop levels (75 to 80 %) stay shorter than the target; parked for play.
- `applyGear` returns the gear it placed and only that is charged; `S.gear` lists placed gear; `S.base` keeps the
  bot's limit for the play log, which logs `extra` gear moves and keeps tool entries out of the move statistics.
- `deckFrom` keeps every valid field of a stored deck (a bad count resets only that item).
