import { colorOf, isJoker, valueOf } from "../core/cards.js";

/**
 * Sami's three habits from his real games, as adjustments on top of the
 * greedy bot's estimate. Bonuses are in value units (1 = one formation rank);
 * the two-player bot converts them to win-chance units itself.
 *
 * 1. The joker waits for a pair: it is only played to turn two cards of the
 *    same value into three of a kind, or when nothing else can be played.
 * 2. Columns open on middle cards (neither 1 nor the top value), one suit at
 *    a time, so straight flushes stay possible in every suit.
 * 3. Two suited cards that follow each other beat a pair, as long as a card
 *    that completes the straight flush is still unseen.
 */
export const STRATEGY = Object.freeze({ openMiddle: 0.1, openNewSuit: 0.1, suitedStart: 0.2 });

/** The three habits, switchable one by one so the report can weigh each. */
export const HABITS = Object.freeze(["joker", "opening", "suited"]);

const realCards = (side) => side.filter((card) => !isJoker(card));

/** A pair waiting for its third card: the only place a joker is worth it. */
export function jokerCompletesTrips(spec, side) {
  const real = realCards(side);
  return side.length === 2 && real.length === 2 && valueOf(spec, real[0]) === valueOf(spec, real[1]);
}

function openingBonus(spec, card, mySides) {
  const value = valueOf(spec, card);
  const middle = value > 1 && value < spec.values ? STRATEGY.openMiddle : 0;
  const opened = new Set(mySides.filter((side) => side.length > 0 && !isJoker(side[0])).map((side) => colorOf(spec, side[0])));
  return middle + (opened.has(colorOf(spec, card)) ? 0 : STRATEGY.openNewSuit);
}

function suitedConnector(spec, a, b) {
  const gap = Math.abs(valueOf(spec, a) - valueOf(spec, b));
  return colorOf(spec, a) === colorOf(spec, b) && gap >= 1 && gap <= 2;
}

/** Is a card that turns `a`, `b` into a straight flush still among `unseen`? */
function suitedOutLeft(a, b, unseen, evaluator) {
  return unseen.entries.some(([card]) => !isJoker(card) && evaluator.formation([a, b, card]) === "straightFlush");
}

function suitedBonus({ spec, side, card, unseen, evaluator }) {
  const [first] = side;
  if (side.length !== 1 || isJoker(first) || !suitedConnector(spec, first, card)) return 0;
  return suitedOutLeft(first, card, unseen, evaluator) ? STRATEGY.suitedStart : 0;
}

/**
 * `{ allowed, bonus }` for placing `card` on `side`. `context` carries
 * `{ spec, evaluator, mySides, unseen, habits }`, `habits` a subset of `HABITS`.
 */
export function strategistAdjust(side, card, context) {
  const { habits } = context;
  if (isJoker(card)) {
    return { allowed: !habits.has("joker") || jokerCompletesTrips(context.spec, side), bonus: 0 };
  }
  let bonus = 0;
  if (habits.has("opening") && side.length === 0) bonus += openingBonus(context.spec, card, context.mySides);
  if (habits.has("suited")) bonus += suitedBonus({ ...context, side, card });
  return { allowed: true, bonus };
}

/**
 * Scores moves with `gainOf(move)` plus the strategist's bonus (times
 * `scale`), after dropping the jokers it would not play — unless that leaves
 * nothing to play.
 */
export function strategistMoves(moves, sideOf, context, { gainOf, scale }) {
  const judged = moves.map((move) => ({ move, ...strategistAdjust(sideOf(move), move.card, context) }));
  const allowed = judged.filter((entry) => entry.allowed);
  const pool = allowed.length > 0 ? allowed : judged;
  return pool.map(({ move, bonus }) => ({ move, gain: gainOf(move) + scale * bonus }));
}
