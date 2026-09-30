import { readFile } from "node:fs/promises";
import { createRng } from "../src/core/random.js";
import { stateAt } from "../src/replay/log.js";
import { rolloutPolicyOf } from "../src/sim/bots.js";
import { EXPERIMENT } from "../src/sim/experimental.js";
import { determinize } from "../src/sim/lookahead.js";
import { modelledDeal } from "../src/sim/model.js";

/**
 * `npm run model`: does the opponent model (`src/sim/model.js`) guess the
 * hidden hand better than chance? In self-play (selfplay/), at moves 10, 16,
 * 22 and 28, the opponent's true hand is known: count how many of its cards
 * each deal gets right, uniform deals against modelled ones, for a few
 * temperatures and numbers of tries. No gain here, no duel.
 */
const TURNS = [10, 16, 22, 28];
const GAMES = 150;
const DEALS = 12;
const TRIALS = [
  { temperature: 0.4, tries: 8 },
  { temperature: 0.15, tries: 8 },
  { temperature: 0.05, tries: 8 },
  { temperature: 0.02, tries: 8 },
  { temperature: 0.02, tries: 24 },
];
const source = new URL("../selfplay/experimental_80.json", import.meta.url);

/** Cards of `dealt` found in `truth`, each card counted once per copy. */
function overlap(dealt, truth) {
  const left = [...truth];
  let found = 0;
  for (const card of dealt) {
    const at = left.indexOf(card);
    if (at === -1) continue;
    left.splice(at, 1);
    found += 1;
  }
  return found;
}

/** Mean cards right per deal, over every position, for one way of dealing. */
function meanOverlap(positions, deal) {
  let total = 0;
  let count = 0;
  for (const [index, state] of positions.entries()) {
    const rng = createRng(1000 + index);
    for (let d = 0; d < DEALS; d += 1) {
      total += overlap(deal(state, rng).hands[1 - state.current], state.hands[1 - state.current]);
      count += 1;
    }
  }
  return total / count;
}

const started = performance.now();
const logs = JSON.parse(await readFile(source, "utf8"));
const positions = logs.slice(0, GAMES).flatMap((log) => TURNS.filter((turn) => turn <= log.turns.length).map((turn) => stateAt(log, turn)));
const judge = rolloutPolicyOf(EXPERIMENT)(createRng(0));
const uniform = meanOverlap(positions, (state, rng) => determinize(state, state.current, rng));
console.log(`# Modèle de l'adversaire — ${positions.length} positions, ${DEALS} donnes chacune\n`);
console.log("| Donnes | Cartes justes sur 6 | Gain sur le hasard |");
console.log("| --- | --- | --- |");
console.log(`| au hasard | ${uniform.toFixed(3)} | — |`);
for (const { temperature, tries } of TRIALS) {
  const modelled = meanOverlap(positions, (state, rng) => modelledDeal(state, state.current, rng, { judge, temperature, tries }));
  console.log(`| modèle, T = ${temperature}, ${tries} essais | ${modelled.toFixed(3)} | ${(100 * (modelled / uniform - 1)).toFixed(1)} % |`);
}
console.log(`\nDurée : ${((performance.now() - started) / 1000).toFixed(0)} s`);
