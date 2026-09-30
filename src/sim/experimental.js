import { IDEA_WEIGHTS, STRATEGIST_IDEAS } from "./ideas.js";
import { SEARCH } from "./search.js";
import { HABITS, STRATEGY } from "./strategist.js";

/**
 * The sandbox bot. It starts as an exact copy of the strategist; an idea is
 * tried by changing it here (and bumping its version in `src/config/bots.js`),
 * then measured with `npm run duel -- experimental stratege`. What wins moves
 * into the strategist, with a new strategist version.
 *
 * Current experiment: the same strategist 1.2 core as Stratège 2.1, with a
 * deeper search (`search.js`): 8 candidates, successive halving, stopped by
 * a rollout budget in duels (`budget`, or `experimental:N` as an engine id)
 * and by a clock in the page, where it also thinks during the human's turn.
 * The ideas it tried before (`ideas.js`, `principles.js`) and what they
 * measured are in docs/strategie.md and docs/analyse-replays.md.
 */
export const EXPERIMENT = Object.freeze({
  habits: HABITS,
  strategy: Object.freeze({ ...STRATEGY }),
  // 0.6: its core also knows which borders are already decided (certainty.js).
  ideas: Object.freeze([...STRATEGIST_IDEAS, "certain"]),
  weights: Object.freeze({ ...IDEA_WEIGHTS }),
  // 0.7: an endgame of 8 cards or fewer, pile empty, is solved exactly (exact.js).
  search: Object.freeze({ ...SEARCH, budget: 400, exact: true }),
});
