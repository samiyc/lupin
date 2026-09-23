import { colorOf, isJoker, valueOf } from "../core/cards.js";

/**
 * Sami's strategy ideas from his games against the web bots
 * (`docs/Prompt/web ui fix prompt.md`), as switchable adjustments on top of
 * the strategist. Bonuses are in value units, like `STRATEGY`.
 *
 * - `counter`: answer the opponent's line on a border with the same shape one
 *   notch higher (5-6-7 against 4-5-6, 5-5-5 against 4-4-4); opening a border
 *   the opponent has not touched offers them that same answer, so it costs
 *   a little (`exposed`).
 * - `middle`: the three middle borders — the ones every run of three adjacent
 *   borders goes through — only open on a solid start: three of a kind held,
 *   or two suited cards in a row with both ends still unseen on the board.
 * - `edges`: a start that is not solid goes to the borders at the edges.
 * - `spread`: never open a value that already sits alone on another border:
 *   two lone 7s want the same cards, and one of them will miss its trips.
 */
export const IDEAS = Object.freeze(["counter", "middle", "edges", "spread"]);

/**
 * What the strategist plays since 1.1.0, measured against strategist 1.0.0
 * over 24 000 games (docs/analyse-replays.md): `spread` alone wins 54.5 %,
 * with `middle` 55.6 %. `counter` and `edges` changed nothing measurable.
 */
export const STRATEGIST_IDEAS = Object.freeze(["middle", "spread"]);

/**
 * `spread` is worth a veto: at 0.15 it won 55.2 %, at 0.6 56.9 %, and no
 * higher weight did better.
 */
export const IDEA_WEIGHTS = Object.freeze({
  counter: 0.15,
  exposed: 0.05,
  middleSolid: 0.15,
  middleWeak: 0.15,
  edges: 0.1,
  spread: 0.6,
});

/** Sorted gaps between values, and whether the cards share a suit. */
function shapeOf(spec, cards) {
  const values = cards.map((card) => valueOf(spec, card)).sort((a, b) => a - b);
  return {
    gaps: values.slice(1).map((value, i) => value - values[i]).join(","),
    suited: new Set(cards.map((card) => colorOf(spec, card))).size === 1,
    top: values.at(-1),
  };
}

/** Two or more real cards, facing at least as many real cards. */
const comparable = (next, theirs) => next.length >= 2 && next.length <= theirs.length && ![...next, ...theirs].some(isJoker);

function counterBonus({ spec, weights }, mine, theirs, card) {
  if (theirs.length === 0) return mine.length === 0 ? -weights.exposed : 0;
  const next = [...mine, card];
  if (!comparable(next, theirs)) return 0;
  const ours = shapeOf(spec, next);
  const answered = shapeOf(spec, theirs.slice(0, next.length));
  return ours.gaps === answered.gaps && ours.suited === answered.suited && ours.top > answered.top ? weights.counter : 0;
}

const onBoard = (spec, boardCards, color, value) => boardCards.some((card) => !isJoker(card) && colorOf(spec, card) === color && valueOf(spec, card) === value);

/** A suited neighbour of `card` in hand whose two outer ends are both still unseen. */
function openConnector({ spec, hand, boardCards }, card) {
  const color = colorOf(spec, card);
  const value = valueOf(spec, card);
  return hand.some((other) => {
    if (other === card || isJoker(other) || colorOf(spec, other) !== color || Math.abs(valueOf(spec, other) - value) !== 1) return false;
    const [low, high] = [Math.min(value, valueOf(spec, other)) - 1, Math.max(value, valueOf(spec, other)) + 1];
    return low >= 1 && high <= spec.values && !onBoard(spec, boardCards, color, low) && !onBoard(spec, boardCards, color, high);
  });
}

/** Three of a kind already in hand (a joker counts), or an open suited connector. */
export function solidStart(context, card) {
  if (isJoker(card)) return false;
  const { spec, hand } = context;
  const twins = hand.filter((other) => other !== card && (isJoker(other) || valueOf(spec, other) === valueOf(spec, card)));
  return twins.length >= 2 || openConnector(context, card);
}

/** The three borders around the centre. */
const isMiddle = (border, count) => Math.abs(border - (count - 1) / 2) <= 1;

function placeBonus(context, border, card) {
  const { ideas, weights, mySides } = context;
  const solid = solidStart(context, card);
  const middle = isMiddle(border, mySides.length);
  let bonus = 0;
  if (ideas.has("middle") && middle) bonus += solid ? weights.middleSolid : -weights.middleWeak;
  if (ideas.has("edges") && !middle && !solid) bonus += weights.edges;
  return bonus;
}

function spreadPenalty({ spec, mySides, weights }, card) {
  if (isJoker(card)) return 0;
  const lone = mySides.some((side) => side.length === 1 && !isJoker(side[0]) && valueOf(spec, side[0]) === valueOf(spec, card));
  return lone ? -weights.spread : 0;
}

/**
 * The ideas' bonus for placing `card` on `border`. `context` is the
 * strategist's, plus `{ ideas: Set, hand, theirSides, boardCards, weights }`.
 */
export function ideasBonus(context, border, card) {
  const { ideas } = context;
  const mine = context.mySides[border];
  let bonus = 0;
  if (ideas.has("counter")) bonus += counterBonus(context, mine, context.theirSides[border], card);
  if (mine.length > 0) return bonus;
  if (ideas.has("middle") || ideas.has("edges")) bonus += placeBonus(context, border, card);
  if (ideas.has("spread")) bonus += spreadPenalty(context, card);
  return bonus;
}
