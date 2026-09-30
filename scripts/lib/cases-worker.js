import { parentPort } from "node:worker_threads";
import { formatCard } from "../../src/core/notation.js";
import { createRng } from "../../src/core/random.js";
import { stateAt } from "../../src/replay/log.js";
import { engineFor } from "../../src/sim/bots.js";
import { legalMoves } from "../../src/sim/game.js";

/** One hard case, one engine, a few seeds: how many times the reference move is played. */
parentPort.on("message", ({ hardCase, engine, seeds }) => {
  const state = stateAt(hardCase.log, hardCase.turn);
  const found = seeds.filter((seed) => {
    const move = engineFor(engine)(createRng(seed)).choose(state, legalMoves(state));
    return `${formatCard(state.spec, move.card)}→${move.border + 1}` === hardCase.reference;
  }).length;
  parentPort.postMessage({ phase: hardCase.phase, found, tried: seeds.length });
});
