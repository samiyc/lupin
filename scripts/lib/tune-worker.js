import { parentPort } from "node:worker_threads";
import { OFFICIAL_RULES } from "../../src/config/rules.js";
import { buildDeck } from "../../src/core/cards.js";
import { createRng } from "../../src/core/random.js";
import { rulesOf } from "../../src/replay/log.js";
import { strategistBot } from "../../src/sim/bots.js";
import { playGame } from "../../src/sim/game.js";
import { coreSettings } from "../../src/sim/tuning.js";

/**
 * One SPSA probe for `scripts/tune.js`: the core with weights `plus` against
 * the core with weights `minus`, on `games` decks each played from both
 * seats, settled at the end as the rollouts are. Returns `plus`'s points.
 */
function probe({ plus, minus, games, deals, seed }) {
  const { spec, order, jokerRule } = rulesOf(OFFICIAL_RULES);
  const rng = createRng(seed);
  const cores = [strategistBot(rng, coreSettings(plus)), strategistBot(rng, coreSettings(minus))];
  let points = 0;
  for (let g = 0; g < games; g += 1) {
    const deck = createRng(deals + 7919 * g).shuffle(buildDeck(spec));
    for (const seat of [0, 1]) {
      const bots = seat === 0 ? cores : [cores[1], cores[0]];
      const { winner } = playGame(spec, { order, jokerRule, rng, bots, deck: [...deck], endMode: "final" });
      if (winner === null) points += 0.5;
      else if (winner === seat) points += 1;
    }
  }
  return points;
}

parentPort.on("message", (task) => parentPort.postMessage(probe(task)));
