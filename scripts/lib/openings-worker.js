import { parentPort } from "node:worker_threads";
import { OFFICIAL_RULES } from "../../src/config/rules.js";
import { createRng } from "../../src/core/random.js";
import { rulesOf } from "../../src/replay/log.js";
import { engineFor } from "../../src/sim/bots.js";
import { createGame, legalMoves } from "../../src/sim/game.js";
import { canonicalKey, toCanonical } from "../../src/sim/openings.js";

/**
 * One opening for the repertoire (`npm run openings`): the first move of a
 * seeded deal, searched at `budget` rollouts, stored in canonical form —
 * with the move the live bot (400 rollouts) would play, to see how often a
 * deeper search disagrees.
 */
parentPort.on("message", ({ seed, budget, until }) => {
  if (Date.now() > until) return parentPort.postMessage(null);
  const { spec, order, jokerRule, endMode } = rulesOf(OFFICIAL_RULES);
  const state = createGame(spec, { order, jokerRule, endMode, rng: createRng(seed) });
  const moves = legalMoves(state);
  const started = performance.now();
  const deep = engineFor(`experimental@${budget}`)(createRng(seed)).choose(state, moves);
  const ms = performance.now() - started;
  const live = engineFor("experimental")(createRng(seed)).choose(state, moves);
  const { key, symmetry } = canonicalKey(state);
  return parentPort.postMessage({ key, move: toCanonical(spec, deep, symmetry), same: deep.card === live.card && deep.border === live.border, ms });
});
