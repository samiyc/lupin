import { EXPERIMENT } from "./experimental.js";
import { IDEA_WEIGHTS } from "./ideas.js";
import { STRATEGY } from "./strategist.js";
import { TUNED_CORE } from "./tuned-core.js";

/**
 * The core's weights that `npm run tune` adjusts by self-play (SPSA), and how
 * a vector of them becomes strategist settings. `step` is the unit the tuner
 * moves in: a weight's plausible range is a few steps either side.
 *
 * The core tuned is the one that plays the rollouts — the experimental core
 * without `certain`, which the rollouts never ran — since that is what the
 * tree's every iteration rests on.
 */
export const TUNED = Object.freeze([
  { key: "temperature", group: "params", start: 0.35, step: 0.05, min: 0.1 },
  { key: "jokerCost", group: "params", start: 0.08, step: 0.03, min: 0 },
  { key: "cardCost", group: "params", start: 0.02, step: 0.01, min: 0 },
  { key: "openMiddle", group: "strategy", start: STRATEGY.openMiddle, step: 0.05, min: -0.5 },
  { key: "openNewSuit", group: "strategy", start: STRATEGY.openNewSuit, step: 0.05, min: -0.5 },
  { key: "suitedStart", group: "strategy", start: STRATEGY.suitedStart, step: 0.05, min: -0.5 },
  { key: "middleSolid", group: "weights", start: IDEA_WEIGHTS.middleSolid, step: 0.05, min: 0 },
  { key: "middleWeak", group: "weights", start: IDEA_WEIGHTS.middleWeak, step: 0.05, min: 0 },
  { key: "spread", group: "weights", start: IDEA_WEIGHTS.spread, step: 0.1, min: 0 },
  { key: "connector", group: "weights", start: IDEA_WEIGHTS.connector, step: 0.1, min: 0 },
]);

/** The rollout core: the experimental settings without `certain`. */
export const ROLLOUT_CORE = Object.freeze({ ...EXPERIMENT, ideas: EXPERIMENT.ideas.filter((idea) => idea !== "certain") });

/** Every tuned weight at its value today. */
export const startingWeights = () => Object.fromEntries(TUNED.map(({ key, start }) => [key, start]));

/** `weights` (`{ key: value }`, missing keys at their start) on top of `base`'s strategist settings. */
export function coreSettings(weights, base = ROLLOUT_CORE) {
  const settings = { ...base, params: { ...base.params }, strategy: { ...base.strategy }, weights: { ...base.weights } };
  for (const { key, group, start, min } of TUNED) settings[group][key] = Math.max(min, weights[key] ?? start);
  return settings;
}

/** The core as `npm run tune` last left it (`tuned-core.js`). */
export const tunedCore = (base = ROLLOUT_CORE) => coreSettings(TUNED_CORE, base);
