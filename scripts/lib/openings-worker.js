import { parentPort } from "node:worker_threads";
import { OFFICIAL_RULES } from "../../src/config/rules.js";
import { createRng } from "../../src/core/random.js";
import { rulesOf } from "../../src/replay/log.js";
import { engineFor } from "../../src/sim/bots.js";
import { createGame, legalMoves } from "../../src/sim/game.js";
import { canonicalKey, toCanonical } from "../../src/sim/openings.js";

/**
 * One opening for the repertoire (`npm run openings`): the first move of the
 * player who starts `deck`, searched by the 0.8's tree at `budget`
 * iterations, stored in canonical form — with the move the 0.8 plays live
 * (800 iterations), to see how often the deeper search disagrees. Returns
 * null once `until` has passed.
 */
parentPort.on("message", ({ deck, seed, budget, until }) => {
  if (Date.now() > until) return parentPort.postMessage(null);
  const { spec, order, jokerRule, endMode } = rulesOf(OFFICIAL_RULES);
  const state = createGame(spec, { order, jokerRule, endMode, deck, rng: null });
  const moves = legalMoves(state);
  const started = performance.now();
  const deep = engineFor(`ismcts@${budget}`)(createRng(seed)).choose(state, moves);
  const ms = performance.now() - started;
  const live = engineFor("ismcts@800")(createRng(seed)).choose(state, moves);
  const { key, symmetry } = canonicalKey(state);
  return parentPort.postMessage({ key, move: toCanonical(spec, deep, symmetry), visits: budget, same: deep.card === live.card && deep.border === live.border, ms });
});
