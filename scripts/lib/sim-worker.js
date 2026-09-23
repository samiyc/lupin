import { parentPort } from "node:worker_threads";
import { DECKS, JOKER_RULES } from "../../src/config/decks.js";
import { ORDERS } from "../../src/config/formations.js";
import { playBatch } from "../../src/sim/simulate.js";
import { playSoloBatch } from "../../src/sim/solo.js";

/** One pool task: a batch of two-player games, or of solo games (`kind: "solo"`). */
parentPort.on("message", (task) => {
  const spec = DECKS[task.deck];
  const common = {
    order: ORDERS[task.order],
    jokerRule: JOKER_RULES[task.jokerRule],
    games: task.games,
    seed: task.seed,
  };
  const tally =
    task.kind === "solo"
      ? playSoloBatch(spec, { ...common, habits: task.habits, optimumGames: task.optimumGames })
      : playBatch(spec, { ...common, players: task.players });
  parentPort.postMessage(tally);
});
