import { parentPort } from "node:worker_threads";
import { DECKS, JOKER_RULES } from "../../src/config/decks.js";
import { ORDERS } from "../../src/config/formations.js";
import { playBatch } from "../../src/sim/simulate.js";

parentPort.on("message", ({ deck, jokerRule, order, games, seed, players }) => {
  const tally = playBatch(DECKS[deck], {
    order: ORDERS[order],
    jokerRule: JOKER_RULES[jokerRule],
    games,
    seed,
    players,
  });
  parentPort.postMessage(tally);
});
