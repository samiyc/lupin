# CLAUDE.md

Guidance for Claude Code working in this repository.

## Project

Schotten Totten adapted to a classic 52-card deck or a French tarot deck, plus
the statistics that justify the adaptation, and a web game to play it
against bots (`npm run play`). Outputs: an exact /
simulated statistics report (`out/statistiques.{md,html}`), a printable rules
sheet (`regles/regles.{html,pdf}`, read by the owner's grandmother, so large
type and plain French), and name proposals (`docs/noms.md`). The game is
called **Bornage** (rules sheet `<title>`, masthead, footers, README); the
project folder is **`Lopin n°742`** (7 borders, 42 cards).

The folder name holds a space and a non-ASCII `°`: keep going through
`pathToFileURL` / `fileURLToPath` / `new URL(..., import.meta.url)` for every
path, as the scripts do, and never build a `file://` URL by string
concatenation. `real life test/` (the owner's photos of real games) is
git-ignored on purpose: heavy, and some carry GPS metadata.

Prose docs are in French, matching how the owner works. Code, comments and
identifiers are English. Node 20.10 on this machine; no Python.

## Commands

```bash
npm run play                  # web game, http://127.0.0.1:4742/ (add ?debug for window.__lopin)
npm run duel -- a b [n]       # bot line-up duel, both seats, 95 % interval
npm run replays               # summary of replays/ + data/replays/
npm run build                 # all statistics → out/ + rules stats box (thread pool, ~3 min)
npm run build:quick           # small samples, for iterating on report layout
node scripts/build.js --reports-only   # re-render reports from out/data.json
npm run pdf                   # headless Edge/Chrome prints regles/regles.html
npm test                      # node --test
npm run lint                  # ESLint 9 + sonarjs, same budget as the Halloween game
npm run check                 # lint + test; run before committing
```

## Layout

```
src/config/   decks.js (decks + joker rules), formations.js (orders),
              simulations.js (what gets played, sample sizes, seed),
              bots.js (the public line-up + versions), rules.js (the sheet's rules)
src/core/     cards, formations (classify, brute-force reference),
              evaluator (O(1) lookup tables), stand-ins (what a joker may
              become), combinatorics (3-card hands), starting-hand, random,
              partition (exact best split of ≤ 21 cards into trios),
              notation ("7♥" ↔ id, shared by logs, real games and the page)
src/sim/      game (rules engine, endMode early|final), bots (random, greedy,
              strategist + one-habit variants, experimental), strategist (Sami's
              three habits), experimental (the sandbox), potential (the bots'
              estimate), simulate (two-player tallies), solo (Sami's solo test
              protocol, same tally for bots and real games)
src/irl/      cards (reads data/irl/essais.json), analysis (tallies the real
              games, Wilson intervals)
src/report/   data (exact + starting hands), tasks (pool tasks: rows, duels,
              solo), analysis + analysis-play (findings + narrative checks),
              ascii/ + markdown.js, html/ + page/, rules-stats (the rules box)
src/replay/   log (write a game log, replay it frame by frame), summary
web/          index.html, style.css, app/: main (tabs), play (Jouer), viewer +
              panels (Observer, Replays), view + hand (PURE, tested), table
              (DOM), drag (input), runner (games as the page plays them),
              explain, replays-api, dom
data/irl/     essais.json: the 10 real games, transcribed from the photos
data/replays/ kept replays (versioned); replays/ holds the rest (ignored)
scripts/      build.js (+ lib/pool.js, lib/sim-worker.js), pdf.js,
              play-server.js (+ lib/replay-files.js), duel.js, replays.js
```

## Rules that everything follows

- **No number is typed by hand into a report.** `src/report/data.js` computes,
  `analysis.js` derives findings, renderers only format. A rule change is an
  edit to `src/config/` followed by a rebuild.
- **The prose is checked against the data.** `assertNarrative()` stops the
  build if the numbers stop supporting the verdict the reports tell (colourless
  joker wins, free joker paradox, one-joker-per-player stalls). Change the prose
  and the assertion together.
- **The formation order is a parameter, not a constant.** With wild cards the
  best formation a hand can make depends on the ranking, and the ranking is
  exactly what the study questions.
- **Evaluator tables must match `bestByBruteForce`.** The tests compare them
  cell by cell for every order and both joker kinds. A colourless joker is a
  set of stand-in ids `n .. n + values - 1` that `colorOf` reads as a phantom
  suit; see `stand-ins.js`.
- **Randomness is seeded**, and pool tasks carry their own seed derived from the
  task index, so `out/data.json` does not depend on thread scheduling.
- **The HTML report works over `file://`.** Its script is inlined as a classic
  `<script>` with the data inlined as JSON; `src/report/page/*.js` is linted as
  a browser script. `out/artifact/statistiques.html` is the same page without
  the doctype/html/head/body skeleton, for publishing as an Artifact.
- **The reference bot is `strategist`** (`REFERENCE_BOT` in
  `src/config/simulations.js`). It beat `greedy` head to head (~58 % of 4 000
  games), so every simulated statistic uses it; `greedy` is still played on
  `PREVIOUS_BOT_ROWS` so the report shows old and new. Changing the reference
  bot moves every resemblance figure: rerun the build and let
  `assertNarrative` say which sentence no longer holds (it caught two).
- **The engine runs in Node and in the browser.** `src/core`, `src/sim`,
  `src/config` and `src/replay` must not import `node:*` (ESLint enforces it);
  the page imports them directly as ES modules, no build step.
- **The page stays thin.** What decides — the view model (`web/app/view.js`),
  the hand order (`hand.js`) — is pure and tested under Node; the DOM layer
  only draws and listens. Input goes through event delegation (the table is
  redrawn on every change), and only the visible tab may draw on the table.
- **The web game settles borders at the end** (`endMode: "final"`): all
  cards are played, borders resolve in the order they filled, first victory
  wins. `tests/final-mode.test.js` holds it to the simulations' early mode.
- **Bots have names and versions** (`src/config/bots.js`). Any change of
  behaviour bumps the version; replays record `id@version`. New ideas go into
  `src/sim/experimental.js` first and are measured with `npm run duel`.
  Every bot exposes `scoreMoves` (logged as its best candidates).
- **Replays are `lopin-replay/1` JSON** with the full deck order;
  `replayStates` rebuilds a game and rejects illegal moves or wrong draws.
  The server writes `replays/` (ignored) and copies kept ones to
  `data/replays/`; it serves only `web/`, `src/`, the rules' fonts and PDF, on
  127.0.0.1. Names go through `scripts/lib/replay-files.js`.
- **The rules sheet has a generated block.** Between `<!-- stats:début -->` and
  `<!-- stats:fin -->` in `regles/regles.html`, `scripts/build.js` writes the
  statistics table (`src/report/rules-stats.js`). Edit the rest of the sheet by
  hand; never that block.
- **Real games are data.** `data/irl/essais.json` is a transcription; its test
  checks every photo holds the 42 cards once. The photos themselves stay out of
  git (`real life test/`: heavy, some carry GPS metadata).
- **The rules sheet ships its fonts** (`regles/fonts/`, OFL). A headless print
  does not wait for Google Fonts: with remote fonts the PDF silently fell back
  to Times. After editing the sheet, check both pages still fit A4 — `.page` is
  `overflow: hidden` in print, so overflow is cut, not flowed.

## Domain notes

- Formations, strongest first in the original: straight flush ("suite
  couleur"), three of a kind ("brelan"), flush ("couleur"), straight
  ("suite"), sum ("somme"). Runs do not wrap (10-1-2 is not a run).
- Ties inside one formation: higher sum wins, then whoever completed first.
- **The wild-card paradox.** In 4×10 + 2 free jokers, under the original order
  a straight flush (208 hands of 11 480) is more common than three of a kind
  (160). Swap them and the two-joker hands become trips: 200 vs 168. No order
  is consistent with rarity (Gadbois 1996).
- **The fix is a colourless joker** (any value, no suit): 32 / 200 / 448 / 1024
  whatever the order, and with the strategist bot the game profile comes back
  to ~95 % of the original's — the most faithful variant tested (6×7: ~93 %,
  tarot: ~86 %; with the greedy bot tarot led, so the ranking of the runners-up
  depends on the bot). In 5 colours it slightly over-feeds trips on 3-card
  hands. The printed sheet no longer mentions tarot.
- **Real games vs bots** (solo protocol): Sami builds far more straight flushes
  than the bots (~29 % vs ~17 %), fewer sums, and reaches ~90 % of the exact
  optimum where the bots reach ~77 %. All his jokers went into trips.
- "One joker per player" leaves a second joker stuck in hand: ~12 % of games
  end without a winner.
- In play, bots build flushes far more than straights even in the original:
  players chase what the order rewards. Games measure resemblance to the
  original, not rarity.
- The simulation resolves a border once both sides are full; it does not model
  early claims by proof. The report states it.
- `1 ** Infinity` is `NaN` in JavaScript: a "known pile" in the solo
  simulation uses a huge finite draw count instead.
