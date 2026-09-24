import { IDEA_WEIGHTS, STRATEGIST_IDEAS } from "./ideas.js";
import { LOOKAHEAD } from "./lookahead.js";
import { HABITS, STRATEGY } from "./strategist.js";

/**
 * The sandbox bot. It starts as an exact copy of the strategist; an idea is
 * tried by changing it here (and bumping its version in `src/config/bots.js`),
 * then measured with `npm run duel -- experimental stratege`. What wins moves
 * into the strategist, with a new strategist version.
 *
 * Current experiment: none — identical to Stratège 2.0.0, the strategist
 * 1.1 looking ahead (`lookahead.js`). The ideas it tried (`ideas.js`) and
 * what they measured are in docs/analyse-replays.md.
 */
export const EXPERIMENT = Object.freeze({
  habits: HABITS,
  strategy: Object.freeze({ ...STRATEGY }),
  ideas: STRATEGIST_IDEAS,
  weights: Object.freeze({ ...IDEA_WEIGHTS }),
  lookahead: Object.freeze({ ...LOOKAHEAD }),
});
