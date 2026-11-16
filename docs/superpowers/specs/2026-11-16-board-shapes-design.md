# Board shapes and the level start screen

Status: draft for the owner, 2026-11-16. Branch `feat/board-shapes`.

## Why

Board layouts (merged 2026-11-16) brought 41 templates, and the owner found them fun. Every board is still a
square, though, and the owner wants more variety: boards that are taller or wider than they are wide, like
9 x 5, 6 x 9 or up to 11 x 11. Gravity makes a short board play differently from a tall one (short columns,
quick refills, more sideways play; long falls and more cascades), so the shape is a gameplay tool, not
decoration.

The screen has to make room. The owner is fine with cutting the decoration down: the story moves to a
screen before each level (Splice style briefings, written later as part of the story work). That screen is
needed anyway: later the player will pick items to take into a level there.

## Goals

- Boards of any width and height from 5 to 11 cells each (for example 9 x 5, 6 x 9, 8 x 11, 11 x 11), on
  templates and on plain pattern levels.
- Mostly square or taller boards; wide ones sometimes (owner).
- The board area takes the board's shape inside the deck frame; cells as large as the space allows.
- The photo strip (the locked panel) cut down to a thin band.
- The terminal screen stays (level, goals, score, patrol count), always in its compact form (the
  variant small screens already get, with fewer log lines).
- A level start screen before every level: level number, goals, moves, a Start button, room reserved
  for the story and for items later.

## Non-goals

- The story text and briefings themselves (story work, later). The layout may change again then.
- Items to take into a level (later; the start screen only leaves room for them).
- Landscape play. Override stays a portrait phone game.
- Keeping old saves. This is a prototype; old saves may load as square boards or be dropped (builder's
  choice, whichever is less code).
- A real width x height model in the rules (see Approaches).

## Anti-goals

- Cells too small to hit with a thumb on the smallest supported screen.
- A board that does not fit the screen, or that scrolls.
- Hatched padding cells showing at the board's edges (the padding is an implementation detail and must
  never be visible).
- Losing the deck frame (the owner wants to keep it).

## Approaches

- **A. Real width and height.** `S.n` becomes `S.w` and `S.h` everywhere (rules, gravity, check, templates,
  levels, bot, save, drawing). Clean, no wasted cells, but touches about 90 places and invites row and
  column mix-ups in gravity and teleporters.
- **B. Square grid, cropped view (picked by the owner).** A w x h board lives in an n x n grid with
  n = max(w, h); the cells outside the w x h rectangle are holes (`cell` 1). Rules, gravity, check and bot
  already handle holes, so they barely change. The drawing and the input show only the w x h rectangle.
  Costs a few wasted cells and a little bot time. A can follow later without changing play.

## Design (approach B)

### The model

- The board rectangle is anchored top left: rows 0 to h - 1, columns 0 to w - 1 of the n x n grid. A wide
  board has its padding rows at the bottom, a tall one its padding columns at the right. Padding is never
  above the board, so the top row stays the spawn row.
- The state gains `S.w` and `S.h` (the visible rectangle); `S.n` stays the grid size, `max(w, h)`. A square
  board has `w = h = n`, so square boards behave exactly as today.
- n now ranges 5 to 11 (was 7 to 9): update `validSave`, the template size check and anything else bound
  to 7 to 9. Width and height each range 5 to 11.

### Templates

- Templates may be non-square: rows give h, tokens per row give w (every row the same length). `parse` pads
  to n x n with holes and returns w and h too. Mirroring flips within the w columns.
- `check` keeps its rules (they already see the padding as holes); the size rule becomes 5 to 11 per side.
  Split boards still need an odd size along the split.
- The w x h rectangle is only the bounding box. Non-square templates are mostly shapes inside it, not
  plain rectangles (owner: boards seen elsewhere use, say, a 5 column body with bumps sticking out to the
  sides, so the shape fills the space in an irregular way). Holes inside the box are drawn as today
  (hatched); only the padding outside the box is invisible.
- Islands and compositions (owner): regions that do not touch at all (a block top left and a block bottom
  right), and irregular mixes such as a 5 x 11 band on the left with three small boxes on the right linked
  by teleporters. The rules already allow this: each region needs its own spawner or a teleporter feed,
  and `check` already rejects a region nothing fills. Islands may make a match impossible across them,
  which is fine; `check` still demands a legal move on a filled board.
- The 41 existing templates stay as they are (square).
- New non-square templates: as many as the research yields (owner: "a shitton"; aim for 60 or more
  candidates and adopt every one that passes `check` and balances), from a second research pass that looks
  at every saved screenshot again. The first pass
  (`docs/research/2026-11-16-board-designs.md`) looked at about 120 board images but only drew square 7 to
  9 boards, so shapes it saw that are wider, taller, islands or compositions were left out (its family
  table lists islands and offset rooms, columns and lanes, letters, towers). The second pass goes back over
  those images (and more where needed) for exactly those shapes, and draws candidates in the new size range:
  wide ones like 9 x 5 and 9 x 6, tall ones like 6 x 9, 7 x 10 and the 9 x 11 tower, islands, and
  compositions, across shapes, teleporters and drops. Tuned with `tools/sim.mjs` like the second library.

### Plain levels

- Plain pattern levels (square today) also get a rectangle: width and height by level from a seeded draw,
  weighted to square or taller, wide sometimes (my call: owner asked for variety on every board, and plain
  levels are a third of all levels). The difficulty-based size choice in `paramsFor` becomes a choice of
  (w, h); area roughly follows today's n by difficulty.
- The blocker patterns (ring, wall row, cross, diagonal, mirrored pairs) work on the w x h rectangle, not
  on n x n.

### Balance

- The bot sets move limits as before; the target stays need about 8 + 14 d. Effort and the size draw are
  tuned with `tools/sim.mjs` until the median ratio is near today's (about 92 %) and prepare time stays
  near today's (median about 0.4 s, at most about 2 s for levels 1 to 60).

### Screen

- **Photo strip:** cut to a thin band (my call: about a third of today's height, keeping the lock and plug
  readable; the builder checks it at 402 x 706, 375 x 548 and 412 x 820 and the owner judges).
- **Terminal screen:** always compact (my call): today `#log2` hides below 780 px and the whole log below
  620 px; now `#log2` is gone at every height and the rest of the log keeps the 620 px rule.
- **Board area:** the canvas takes the board's aspect: cell size = min(free width / w, free height / h),
  the canvas w x cell by h x cell, centred in the free space. Only the w x h rectangle is drawn; input maps
  only inside it.
- **Size limit by screen:** the allowed sizes must fit the smallest supported screen (375 x 548) with
  cells of at least 30 css px (my call; today's 9 x 9 at 375 px wide gives about 37 px). The builder
  measures the free board space at 375 x 548 after the trim and caps the size draw (and the templates) to
  what fits; if 11 rows cannot fit there at 30 px, tall boards stop at what does, and the spec gets a note.

### Level start screen

- Shown before every level start: a new level, a retry after a loss, a restart from the menu, a level
  picked in the level picker, `?level=N`. Not shown when a reload resumes a level in progress.
- Content: chapter and level, the goals (same icons and counts as the HUD), the move limit, DECKER's
  comms line for the level, and a Start button. The comms line (owner) moves here from the photo strip,
  with the mechanic hints (`hintCrack`, `hintFirewall`, `hintDrop`) on their levels; it grows into the
  briefing during the story work. Room is left for items later. The `#comms` overlay leaves the play
  screen. (My call: no
  board preview; it would give away the deal and the owner did not ask for it.)
- Preparing: the worker keeps preparing the next level and the next retry during play, as today. If the
  attempt is ready, the screen shows it at once. If not, the screen shows the level number and a
  preparing line while the worker runs, then fills in the goals and moves and enables Start. This
  replaces the loading card (the 20 s stuck guard and the reload offer stay).
- Made from the existing sheet (the panel the win and loss screens use), in the terminal style. The
  board is not visible behind it (my call: the sheet's dimmed backdrop would show the deal).
- The attempt starts on Start, not when the screen appears (my call): a reload on the start screen shows
  the start screen again, and the play log opens the attempt on Start.
- The win screen's "next" and the loss screen's "retry" lead to this screen, not straight into the level.

### Docs and tests

- `docs/architecture.md` with the code; this spec gets "Changed in testing" notes during owner tests.
- Tests: parse and check on non-square templates (padding, mirroring, size rule), gravity and spawns on a
  wide and a tall board, `validSave` for n 5 to 11 and w, h, plain level sizes and patterns on rectangles,
  and that the level start screen is reached on each start path (as far as the UI tests reach today).

## Left to the builder

- The exact size draw for plain levels, the new templates and their tuning.
- The exact strip height, start screen layout and copy (all visible text in `lang/en.json`, no em-dashes,
  typographic apostrophes).
- Whether old saves load as squares or are dropped.
