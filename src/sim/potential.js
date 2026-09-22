import { buildDeck, isJoker, valueOf } from "../core/cards.js";

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

export function createValuer(state) {
  const { spec, evaluator } = state;
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
  const counts = new Map();
  for (const card of buildDeck(state.spec)) counts.set(card, (counts.get(card) ?? 0) + 1);
  const seen = [...state.hands[player], ...state.borders.flatMap((b) => b.sides.flat())];
  for (const card of seen) counts.set(card, counts.get(card) - 1);
  const entries = [...counts].filter(([, count]) => count > 0);
  return { entries, total: entries.reduce((sum, [, count]) => sum + count, 0) };
}

/** `context`: { valuer, hand, unseen, draws, jokerAllowed(side) }. */
export function sidePotential(side, context) {
  if (side.length >= 3) return context.valuer.value(side);
  if (side.length === 2) return pairPotential(side, context);
  if (side.length === 1) return singlePotential(side, context);
  return context.valuer.empty;
}

const usable = (card, jokerOk) => jokerOk || !isJoker(card);

function pairPotential(side, context) {
  const jokerOk = context.jokerAllowed(side);
  let best = -Infinity;
  for (const card of context.hand) {
    if (usable(card, jokerOk)) best = Math.max(best, context.valuer.value3(side, card));
  }
  return Math.max(best, drawPotential(side, context, jokerOk));
}

/**
 * Completing from the draw: the average over unseen cards, plus the best
 * upside of any formation weighted by the chance of drawing one of its outs.
 */
function drawPotential(side, { valuer, unseen, draws }, jokerOk) {
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
  context.hand.forEach((card, i) => {
    if (!usable(card, jokerOk)) return;
    const rest = context.hand.filter((_, j) => j !== i);
    const pair = pairPotential([...side, card], { ...context, hand: rest });
    best = Math.max(best, PAIR_DISCOUNT * pair);
  });
  return best;
}
