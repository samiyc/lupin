import { gatesOf } from "./ideas.js";

/**
 * The settings a strategist's scoring uses (bots.js): its habits, ideas and
 * weights, with the idea families gated once (`gatesOf`). With `earlyIdeas`,
 * there are two: `early`, those ideas added, while `state.turn < earlyUntil`,
 * and `late` after — a bonus that helps the tree where it is weakest, the
 * first turns, without weighing on the rest (Sami, 03/10). `earlyHabits` does
 * the same for habits.
 */
export function tuningsOf({ habits, strategy, ideas, earlyIdeas, earlyHabits = [], weights, params }) {
  const tuningFor = (habitSet, set) => ({ habits: habitSet, strategy, ideas: set, gates: gatesOf(set), weights, params });
  const late = tuningFor(new Set(habits), new Set(ideas));
  if (earlyIdeas.length === 0 && earlyHabits.length === 0) return { late, early: late };
  return { late, early: tuningFor(new Set([...habits, ...earlyHabits]), new Set([...ideas, ...earlyIdeas])) };
}
