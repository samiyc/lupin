# CLAUDE.md

Guidance for Claude Code working in this repository.

## Project

Schotten Totten adapted to a classic 52-card deck or a French tarot deck, plus
the statistics that justify the adaptation. Three outputs: an exact /
simulated statistics report (`out/statistiques.{md,html}`), a printable rules
sheet (`regles/regles.{html,pdf}`, read by the owner's grandmother, so large
type and plain French), and name proposals (`docs/noms.md`). "Bornage" is the
provisional name; it appears only in the rules sheet's `<title>`, masthead and
footers, and in the README.

Prose docs are in French, matching how the owner works. Code, comments and
identifiers are English. Node 20.10 on this machine; no Python.

## Commands

```bash
npm run build                 # all statistics → out/ (thread pool, ~1.5 min)
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
              simulations.js (what gets played, sample sizes, seed)
src/core/     cards, formations (classify, brute-force reference),
              evaluator (O(1) lookup tables), stand-ins (what a joker may
              become), combinatorics (3-card hands), starting-hand, random
src/sim/      game (rules engine), bots (random, greedy), potential (greedy's
              estimate), simulate (tallies, mergeable across threads)
src/report/   data (compute everything), analysis (findings + narrative check),
              ascii/ + markdown.js, html/ + page/ (template, css, explorer)
scripts/      build.js (+ lib/pool.js, lib/sim-worker.js), pdf.js
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
  whatever the order, and the game profile comes back to ~91 % of the
  original's (the 6×7 variant the owner already plays scores ~90 %). In 5
  colours it slightly over-feeds trips (280 vs 250 flushes) on 3-card hands,
  but 6-card hands and games keep the order.
- "One joker per player" leaves a second joker stuck in hand: ~12 % of games
  end without a winner.
- In play, bots build flushes far more than straights even in the original:
  players chase what the order rewards. Games measure resemblance to the
  original, not rarity.
- The simulation resolves a border once both sides are full; it does not model
  early claims by proof. The report states it.
