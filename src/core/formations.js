import { FORMATIONS } from "../config/formations.js";
import { colorOf, isJoker, valueOf } from "./cards.js";
import { jokerStandIns } from "./stand-ins.js";

/** One bit per formation, in `FORMATIONS` order. */
export const FORMATION_BIT = Object.freeze(
  Object.fromEntries(FORMATIONS.map((formation, i) => [formation, 1 << i])),
);

/** Enough room above any three-card sum (3 × 10 = 30) to encode the rank. */
const SUM_SPAN = 64;

function shape(spec, cards) {
  const values = cards.map((card) => valueOf(spec, card)).sort((a, b) => a - b);
  const colors = cards.map((card) => colorOf(spec, card));
  return {
    sameColor: colors.every((color) => color === colors[0]),
    run: values[1] === values[0] + 1 && values[2] === values[1] + 1,
    trips: values[0] === values[2],
  };
}

/**
 * The formation three real cards make, strongest reading first. The order of
 * the tests does not depend on the ranking: a real triple can only be two
 * formations at once as a straight flush, which is also a flush and a run.
 */
export function classify(spec, cards) {
  const { sameColor, run, trips } = shape(spec, cards);
  if (sameColor && run) return "straightFlush";
  if (trips) return "threeOfAKind";
  if (sameColor) return "flush";
  return run ? "straight" : "sum";
}

/**
 * Every pattern three real cards satisfy, as a bit mask. Non-exclusive on
 * purpose: a straight flush "contains" a flush and a straight.
 */
export function patternMask(spec, cards) {
  const { sameColor, run, trips } = shape(spec, cards);
  let mask = FORMATION_BIT.sum;
  if (sameColor) mask |= FORMATION_BIT.flush;
  if (run) mask |= FORMATION_BIT.straight;
  if (sameColor && run) mask |= FORMATION_BIT.straightFlush;
  if (trips) mask |= FORMATION_BIT.threeOfAKind;
  return mask;
}

/** True when `mask` carries the bit of `formation`. */
export const hasFormation = (mask, formation) => (mask & FORMATION_BIT[formation]) !== 0;

export const sumOf = (spec, cards) =>
  cards.reduce((total, card) => total + valueOf(spec, card), 0);

/** Strength as one integer: higher is better, rank first, then sum. */
export function strengthScore(order, formation, sum) {
  return (order.length - 1 - order.indexOf(formation)) * SUM_SPAN + sum;
}

export function formationOfScore(order, score) {
  return order[order.length - 1 - Math.floor(score / SUM_SPAN)];
}

export const sumOfScore = (score) => score % SUM_SPAN;

/**
 * Reference definition of "the best a side can make": every joker tries every
 * card it may stand for — any real card, duplicates included, or any value
 * without a suit for a colourless joker. Slow, and only used to check the
 * lookup tables of `evaluator.js` against.
 */
export function bestByBruteForce(spec, cards, order, jokerRule) {
  const real = cards.filter((card) => !isJoker(card));
  const jokers = cards.length - real.length;
  if (jokers === 0) {
    return strengthScore(order, classify(spec, real), sumOf(spec, real));
  }
  let best = -1;
  for (const card of jokerStandIns(spec, jokerRule)) {
    const withCard = [...real, card, ...Array(jokers - 1).fill(cards.find(isJoker))];
    best = Math.max(best, bestByBruteForce(spec, withCard, order, jokerRule));
  }
  return best;
}
