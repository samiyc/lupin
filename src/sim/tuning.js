import { gatesOf } from "./ideas.js";

/**
 * The settings a strategist's scoring uses (bots.js): its habits, ideas and
 * weights, with the idea families gated once (`gatesOf`). With `earlyIdeas`,
 * there are two: `early`, those ideas added, while `state.turn < earlyUntil`,
 * and `late` after — a bonus that helps the tree where it is weakest, the
 * first turns, without weighing on the rest (Sami, 03/10).
 */
export function tuningsOf({ habits, strategy, ideas, earlyIdeas, weights, params }) {
  const tuningFor = (set) => ({ habits: new Set(habits), strategy, ideas: set, gates: gatesOf(set), weights, params });
  const late = tuningFor(new Set(ideas));
  return { late, early: earlyIdeas.length > 0 ? tuningFor(new Set([...ideas, ...earlyIdeas])) : late };
}
