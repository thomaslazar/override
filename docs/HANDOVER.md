# Override: starting handover

## About this handover

Override is an ad-free, fair match-3 game for phones and the third game in a small family, after Kiln and Splice. It is set in Splice's cyberpunk world: you are the on-site hacker of a crew doing runs. Endless generated levels, no ads, no accounts, no tracking. A hobby project, built for fun.

This is a brainstorm handover, not a spec. The name, setting, role, chapter structure and fairness rules are decided. The look, the exact mechanics and most names inside the game are proposals to try out and settle with the user. When something here is marked as a proposal or an open question, ask before building on it.

Before starting, read the `CLAUDE.md`, `README.md` and code of both sibling repos ([kiln](https://github.com/thomaslazar/kiln), [splice](https://github.com/thomaslazar/splice)). Override should reuse their patterns and conventions.

The core frustration behind all three games: mainstream match-3 games like Candy Crush are built to sell boosters and lives. Override has all the mechanics people enjoy in that genre, without the parts designed to make you pay.

## Core game

Override is a classic match-3 with the full feature set of the genre. The theme names below are proposals; the mechanics are what the user asked for.

**Rules.** A grid of tiles in several types. Swap two neighbouring tiles up, down, left or right. Three or more of one type in a line clear; tiles above fall and new ones drop in from the top; new matches cascade. A swap that makes no match is undone.

**Goals.** Each level has one or more goals and a move limit:

- clear a number of tiles of a given type
- break a number of blockers by matching next to them
- bring items down and off the bottom of the board
- combinations of the above

**Blockers (proposals).** Encrypted cells that crack after one to three adjacent matches, firewalls that hold a tile in place, and later a trace that spreads if you leave it alone.

**Move limit (proposal).** Framed as the time until the patrol comes back, counted down by the decker on comms. This keeps the pressure physical and sets it apart from Splice's trace.

**Specials and combos.** Working names are proposals, the behaviour follows the genre:

| Made by | Special (working name) | Effect |
| --- | --- | --- |
| 4 in a line | Worm | Clears a row or column |
| L or T shape | Logic bomb | Clears an area around it |
| 5 in a line | Zero-day | Clears every tile of one type |

| Combo | Effect |
| --- | --- |
| Worm + worm | Clears a row and a column (cross) |
| Worm + logic bomb | Clears three rows and three columns |
| Logic bomb + logic bomb | Larger area clear |
| Zero-day + worm or bomb | Every tile of that type becomes that special and fires |
| Zero-day + zero-day | Clears the whole board |

Board size, number of tile types and the exact shape rules are open (see open questions).

## Setting and role

You are the crew's on-site hacker during a run, in the same world as Splice. In Splice you work alone, gathering data and intel before runs. In Override you are on the run itself, acting on site.

**What the role does.** You jack a deck into devices and hack them on the spot, not over the network. A level can be any obstacle a run needs cleared:

- cracking an electronic lock or maglock
- disabling on-site security: cameras, alarms, sensors
- bridging the gap for the crew's decker, for example by planting remote access on an air-gapped system so the decker can get in and pull data
- doing the hack yourself when nobody can reach it remotely

Air-gapped systems are a good hook for why the role exists: some things can only be reached by standing next to them.

**What it is not.** Not mechanical lockpicking, and not component-level hardware work with soldering irons. The fantasy is the hacker who is physically there, with a deck and a cable.

**Link to Splice.** Same city, same time (parallel, not before or after). Loosely coupled: Override is not the other side of Splice's story, and it plays fine without Splice. Characters from Splice can appear as cameos, such as the fence, the fixers and the journalist. Proposal: avoid Wren cameos, since her death pins down when things happen in relation to Splice.

## Crew and comms

The voice in your ear is the crew's decker, helping you on the job. It's a partner on the run, not a boss giving orders, which is a different relationship from Splice's fixer briefings.

Proposals:

- Each level gets a one-line setup from a crew member on comms, for example: “Cameras on this floor. Give me thirty seconds of dark.” Short, plain, sentence case, theme used lightly.
- The rest of the crew (face, muscle, driver) can chime in where their part of the run matters.
- Splice's CRT comm portraits can be reused for the crew.

The decker's name, the crew's names and whether the crew is fixed or changes over chapters are open.

## Chapters and runs

Start with the same chapter system as Kiln and Splice: difficulty waxes over about 30 levels, then resets for the next chapter. Get this working before adding any more complex systems.

On top of that, a chapter is a set of runs. Small runs of 5 to 10 levels each feed into a big final run that closes the chapter. Each level in a run is one obstacle on site: the gate, the cameras, the server room door, the thing you came for, the way out.

One split that fits 30 levels (proposal):

| Levels | What happens |
| --- | --- |
| 1 to 20 | Three or four small runs of 5 to 7 levels. Each run's last level is a small peak. |
| 21 to 30 | The big run that closes the chapter, at the top of the difficulty curve. |

Run lengths can vary by job type, as long as the chapter rhythm holds.

The small runs feed the big one in the story: one gets the access codes, one plants access for the decker, one gets an inside contact. At first this is only flavour in the comms lines. Making completed runs give the final run a mechanical edge is a later idea (see below).

## Fairness, gear and shop

Fairness is the reason this game exists. Losing should never be down to bad luck or a missing purchase.

**Decided:**

- No ads, no accounts, no tracking. Progress saved locally.
- Difficulty eases on a level after a number of failed tries, as in Kiln and Splice.
- Gear: before a level you can choose to take items in, for example starting with a worm already on the board. Like other match-3 games.
- A shop where gear is bought, so gear stays scarce and has to be refreshed.

**Proposed guardrails for the shop:**

- One in-game currency, earned only by playing. Splice has frags, so Override needs its own (name open).
- Fixed, visible prices. No sales, bundles or limited offers.
- A small stockpile cap per item, so hoarding can't trivialise levels.
- No timers, energy or lives.
- Every level is verified beatable without gear by the balance bot, the same generate, verify, regenerate loop as Splice. Gear makes a level easier, never possible.

Failure easing and gear cover each other: if a player is short on currency, easing still gets them through.

**Match-3 specific:** the board must always have a valid move. If it doesn't, reshuffle for free, never end the level on a dead board.

## Look and feel

The user likes the direction below but wants to see it before committing, so build a quick visual prototype early and iterate.

**Proposal: two layers.** The background is the physical world: the device you're jacked into, your cable running into its port, rain and sodium light. The board is the screen of your field deck, a rugged handheld tool with a practical, chunky UI, closer to a lab instrument than to glowing cyberspace. It should look clearly different from Splice's neon cyberspace and Kiln's ceramics.

The background can change with the obstacle (a maglock panel, a camera hub, a server rack) and visibly react as you progress, for example a door unlocking on the last level of a run.

**Accessibility from the start:** every tile type gets a distinct shape or glyph, so matching works without seeing colour. Light and dark themes, `prefers-reduced-motion` respected, as in the siblings.

## What to take from Kiln and Splice

Check these against the current code of both repos; they may have evolved.

- **Seeded everything.** A level is fully reproducible from level number, failed attempts and a salt.
- **Difficulty model.** A slow ramp per chapter with breather levels, and each failed attempt lowering difficulty.
- **Verified levels.** Generate, let a bot play it, regenerate if it fails. A balance bot (`tools/sim.mjs`) from day one.
- **Pure core.** Game logic in a module with no DOM or canvas access, separate from rendering and input, so tests and the bot import it directly.
- **Persistence.** One versioned state object in `localStorage`, saved after every move. Close the app mid-level and come back to the same board.
- **PWA.** Installable, works offline, no build step or dependencies unless truly needed. Deployed to GitHub Pages by a workflow.
- **Languages.** English and German from the start, one JSON file per language.
- **UI pieces.** Bottom-sheet dialogs for win, loss and menu; the quiet header; light and dark tokens.
- **Story text.** Splice's seeded brief generation is the model for the comms lines.
- **Music.** Splice's generated music engine could be reused later with its own style.
- **Conventions.** No em-dashes in copy or docs. Typographic apostrophes (’) in visible text. Short, plain copy in sentence case. Ask before committing.
- **License.** PolyForm Noncommercial 1.0.0, like the siblings.

## Later ideas and open questions

**Later ideas, not for the first version:**

- **Casing levels:** lighter scouting levels before a run, whose results change the run.
- **Runs with mechanical impact:** completing a small run gives the chapter's final run an edge, like a starting special or fewer blockers. Similar to how intel works in Splice.
- **Spreading goals:** for example planting access that spreads across the board wherever you make matches.
- **Spreading trace** as a blocker type.

**Open questions for the user:**

- Board size and number of tile types (Kiln is 8x8).
- What the tiles are in the fiction.
- Names of the specials, blockers and the in-game currency.
- Names of the decker and the crew, and whether the crew is fixed.
- Which gear items exist, their prices and stockpile caps.
- How many failed tries before difficulty eases.
- Show a score, or goals only?
- The name Override is also used by a few commercial games, which may affect how easy it is to find in search. Fine for a hobby PWA, but worth knowing.
