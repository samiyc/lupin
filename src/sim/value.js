import { isJoker } from "../core/cards.js";
import { VALUE_WEIGHTS } from "./value-weights.js";

/**
 * A learned value of a position (step 2 of out/next-steps.html): the chance
 * that the player to move wins, read without playing the game out.
 *
 * The core already judges each border on its own (`borderOdds` in bots.js).
 * `independentWin` turns those seven odds into the odds of the game — four
 * borders, or three side by side — as if the borders were independent; a
 * logistic regression, fitted on self-play by `npm run value`, then corrects
 * what that leaves out. The core's odds are sure of themselves (they rank
 * moves, they were never calibrated), so the game odds are read at three
 * softenings of them; then the phase, the borders already closed, the jokers
 * in hand. `oddsOf` is injected, so this module does not import the
 * bots (which build their tree search on it).
 */
export const VALUE_FEATURES = Object.freeze(["bias", "soft2", "soft4", "soft8", "soft4Late", "closed", "jokers", "late"]);

const clamp = (p) => Math.min(1 - 1e-3, Math.max(1e-3, p));
const logit = (p) => Math.log(clamp(p) / (1 - clamp(p)));
const sigmoid = (z) => 1 / (1 + Math.exp(-z));
/** The game odds, each border's odds first pulled towards even by `softness`, as a logit. */
const softGame = (odds, spec, softness) => logit(independentWin(odds.map((p) => sigmoid(logit(p) / softness)), spec));
const isFull = (border) => border.sides.every((side) => side.length === 3);

/** Does `mask` (one bit per border) hold `run` borders side by side? */
function hasRun(mask, count, run) {
  let streak = 0;
  for (let border = 0; border < count; border += 1) {
    streak = mask & (1 << border) ? streak + 1 : 0;
    if (streak >= run) return true;
  }
  return false;
}

/** Points for the first player in a finished board `mask` (theirs is the complement). */
function boardPoints(mask, { borders, majority, adjacent }) {
  const theirs = ~mask & ((1 << borders) - 1);
  const [mine, other] = [hasRun(mask, borders, adjacent), hasRun(theirs, borders, adjacent)];
  if (mine !== other) return Number(mine);
  if (mine) return 0.5;
  let won = 0;
  for (let border = 0; border < borders; border += 1) won += (mask >> border) & 1;
  return Number(won >= majority);
}

/** The odds of winning the game if each border were won independently with `odds`. */
export function independentWin(odds, spec) {
  let total = 0;
  for (let mask = 0; mask < 1 << spec.borders; mask += 1) {
    let chance = 1;
    for (let border = 0; border < spec.borders; border += 1) chance *= mask & (1 << border) ? odds[border] : 1 - odds[border];
    total += chance * boardPoints(mask, spec);
  }
  return total;
}

/** The features of `state` for the player to move, in `VALUE_FEATURES` order. */
export function valueFeatures(state, odds) {
  const me = state.current;
  const late = 1 - state.pile.length / (state.spec.colors * state.spec.values + state.spec.jokers);
  // A closed border: settled, or both sides full — the core's odds then only break the tie of the sums.
  const closed = state.borders.reduce((sum, border, i) => {
    if (border.owner !== null) return sum + (border.owner === me ? 1 : -1);
    return isFull(border) ? sum + Math.sign(odds[i] - 0.5) : sum;
  }, 0);
  const jokers = state.hands[me].filter(isJoker).length;
  const [soft2, soft4, soft8] = [2, 4, 8].map((softness) => softGame(odds, state.spec, softness));
  return [1, soft2, soft4, soft8, soft4 * late, closed / state.spec.borders, jokers, late];
}

/** `(state, player)` → the chance that `player` wins, by the learned weights. */
export function createValue(oddsOf, weights = VALUE_WEIGHTS) {
  return (state, player) => {
    const features = valueFeatures(state, oddsOf(state));
    const score = features.reduce((sum, feature, i) => sum + feature * weights[i], 0);
    const mine = sigmoid(score);
    return player === state.current ? mine : 1 - mine;
  };
}
