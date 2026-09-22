# CLAUDE.md

Guidance for Claude Code working in this repository.

## Project

Schotten Totten adapted to a classic 52-card deck or a French tarot deck, plus
the statistics that justify the adaptation. Three outputs: an exact /
simulated statistics report (`out/statistiques.{md,html}`), a printable rules
sheet (`regles/regles.{html,pdf}`, read by the owner's grandmother, so large
type and plain French), and name proposals (`docs/noms.md`).

Prose docs are in French, matching how the owner works. Code, comments and
identifiers are English. Node 20.10 on this machine; no Python.

## Commands

```bash
npm run build          # all statistics → out/ (full Monte Carlo, ~1 min)
npm run build:quick    # same, with small sample sizes, for iterating on reports
npm run pdf            # headless Edge/Chrome prints regles/regles.html to PDF
npm test               # node --test
npm run lint           # ESLint 9 + sonarjs, same budget as the Halloween game
npm run check          # lint + test; run before committing
```

## Rules that everything follows

- **No number is typed by hand into a report.** `scripts/build.js` computes,
  `src/report/` formats. A rule change is an edit to `src/config/decks.js`
  followed by a rebuild.
- **`src/config/decks.js` is data only**: colours, values, jokers, borders,
  hand size, win condition. Everything else reads it.
- **The formation order is a parameter, not a constant.** With wild cards the
  best formation a hand can make depends on the ranking, and the ranking is
  exactly what the study questions (see "The wild-card paradox" below).
- **Randomness is seeded.** `src/core/random.js` holds the only
  `Math.random`-free PRNG; two builds with the same seed produce the same
  `out/data.json`.
- **The HTML report works over `file://`.** Its script is inlined as a classic
  `<script>` (no ES module), with the data inlined as JSON. That is why
  `src/report/page/*.js` is linted as a browser script, not a module.

## Domain notes

- Formations, strongest first in the original: straight flush ("suite de même
  couleur"), three of a kind ("brelan"), flush ("couleur"), straight
  ("suite"), sum ("somme"). Runs do not wrap (9-1-2 is not a run).
- Ties inside one formation: higher sum wins, then whoever completed first.
- **The wild-card paradox.** In 4×10 + 2 jokers, under the original order a
  straight flush (208 hands of 11 480) is more common than three of a kind
  (160). Swap them and the two-joker hands become trips: 200 vs 168, and the
  order is wrong again. No order is consistent with rarity (Gadbois 1996).
  "At most one joker per border" removes the two-joker hands and makes the
  counts order-independent. Tests pin these numbers.
- The simulation resolves a border once both sides are full; it does not model
  early claims by proof. The report states it.
