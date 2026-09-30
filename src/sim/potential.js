import { JOKER, isJoker, realCardCount, valueOf } from "../core/cards.js";

/**
 * What a side of a border is likely to be worth once finished, seen from one
 * player: the value of a formation is its rank (0 for a sum, 4 for the top of
 * the order) plus the sum as a fraction, so a better formation always
 * outweighs a better sum.
 *
 * Cheap on purpose — the simulation plays hundreds of thousands of turns:
 * a finished side is exact, two cards look at every card still unseen, one
 * card looks at the pairs it could make with the hand, an empty side is a
 * constant.
 */
const SPAN = 64;
const PAIR_DISCOUNT = 0.9;

/** One valuer per evaluator: it only reads the spec and the evaluator, and a scoring used to rebuild it. */
const valuers = new WeakMap();

export function createValuer(state) {
  const known = valuers.get(state.evaluator);
  if (known?.spec === state.spec) return known.valuer;
  const valuer = buildValuer(state);
  valuers.set(state.evaluator, { spec: state.spec, valuer });
  return valuer;
}

function buildValuer({ spec, evaluator }) {
  // One above the highest sum, so a value's integer part is always its rank.
  const sumScale = 3 * spec.values + 1;
  const average = (spec.values + 1) / 2;
  const toValue = (score) => Math.floor(score / SPAN) + (score % SPAN) / sumScale;
  const value = (cards) => toValue(evaluator.score(cards));
  const cardValue = (card) => (isJoker(card) ? spec.values : valueOf(spec, card));
  return {
    value,
    /** Two placed cards plus one more, without building an array. */
    value3: (side, card) => toValue(evaluator.score3(side[0], side[1], card)),
    empty: (3 * average) / sumScale,
    single: (card) => (cardValue(card) + 2 * average) / sumScale,
  };
}

/**
 * The cards a player cannot see: the deck minus their hand and the board. The
 * opponent's hand is in there — that is what not seeing it means.
 */
export function unseenCards(state, player) {
  // A flat count per card, the jokers last: the deck's own order, which the sums downstream keep.
  const real = realCardCount(state.spec);
  const counts = new Array(real + 1).fill(1);
  counts[real] = state.spec.jokers;
  const see = (card) => {
    counts[isJoker(card) ? real : card] -= 1;
  };
  state.hands[player].forEach(see);
  for (const border of state.borders) border.sides.forEach((side) => side.forEach(see));
  const entries = [];
  let total = 0;
  counts.forEach((count, index) => {
    if (count <= 0) return;
    entries.push([index === real ? JOKER : index, count]);
    total += count;
  });
  return { entries, total };
}

/** `context`: { valuer, hand, unseen, draws, jokerAllowed(side), memo? }. */
export function sidePotential(side, context) {
  if (side.length >= 3) return context.valuer.value(side);
  if (side.length === 2) return pairPotential(side, context);
  if (side.length === 1) return singlePotential(side, context);
  return context.valuer.empty;
}

const usable = (card, jokerOk) => jokerOk || !isJoker(card);

/** `skip`: the index of a hand card already on `side`, left out without copying the hand. */
function pairPotential(side, context, skip = -1) {
  const jokerOk = context.jokerAllowed(side);
  const { hand } = context;
  let best = -Infinity;
  for (let i = 0; i < hand.length; i += 1) {
    if (i !== skip && usable(hand[i], jokerOk)) best = Math.max(best, context.valuer.value3(side, hand[i]));
  }
  return Math.max(best, drawPotential(side, context, jokerOk));
}

/**
 * Completing from the draw: the average over unseen cards, plus the best
 * upside of any formation weighted by the chance of drawing one of its outs.
 *
 * It depends only on the two cards (the unseen cards and the draws are fixed
 * for one scoring), yet one scoring asks for the same pair dozens of times:
 * a context may carry a `memo` Map, fresh for each scoring, to answer once.
 */
function drawPotential(side, context, jokerOk) {
  const { memo } = context;
  if (!memo) return drawPotentialOf(side, context, jokerOk);
  // A number rather than a string: cards run from -1 (joker) up, well under 63.
  const [low, high] = side[0] < side[1] ? side : [side[1], side[0]];
  const key = ((low + 1) * 64 + high + 1) * 2 + Number(jokerOk);
  let value = memo.get(key);
  if (value === undefined) {
    value = drawPotentialOf(side, context, jokerOk);
    memo.set(key, value);
  }
  return value;
}

function drawPotentialOf(side, { valuer, unseen, draws }, jokerOk) {
  const outs = new Array(5).fill(0);
  const bestOf = new Array(5).fill(0);
  let mean = 0;
  let total = 0;
  for (const [card, count] of unseen.entries) {
    if (!usable(card, jokerOk)) continue;
    const value = valuer.value3(side, card);
    const rank = Math.floor(value);
    outs[rank] += count;
    bestOf[rank] = Math.max(bestOf[rank], value);
    mean += value * count;
    total += count;
  }
  // Nothing left that could finish it: the side is as good as dead.
  if (total === 0) return 0;
  mean /= total;
  let upside = 0;
  for (let rank = 1; rank < outs.length; rank += 1) {
    const chance = 1 - (1 - outs[rank] / unseen.total) ** draws;
    upside = Math.max(upside, chance * (bestOf[rank] - mean));
  }
  return mean + upside;
}

function singlePotential(side, context) {
  const jokerOk = context.jokerAllowed(side);
  let best = context.valuer.single(side[0]);
  // The hand minus the card being paired: its index is skipped, not copied out.
  const { hand } = context;
  for (let i = 0; i < hand.length; i += 1) {
    if (!usable(hand[i], jokerOk)) continue;
    best = Math.max(best, PAIR_DISCOUNT * pairPotential([side[0], hand[i]], context, i));
  }
  return best;
}
