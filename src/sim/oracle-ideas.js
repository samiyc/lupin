import { colorOf, isJoker, valueOf } from "../core/cards.js";
import { gateOn } from "./gates.js";
import { shapeOf } from "./shapes.js";

/**
 * Bonuses that push the core the way the oracle played (03/10,
 * data/oracle-diffs.json: on 2,300 gaps, the oracle's move against the core's
 * favourite). Not a proof that the oracle is right — the core-against-core
 * duels say whether the core gains by it.
 *
 * - `stay`: a card on a side already started earns `stay` (the oracle puts a
 *   2nd card 65 % of the time against 51 %, a 3rd 27 % against 17 %);
 * - `noAnswer`: answering — my side empty, the opponent's not — costs
 *   `noAnswer` (7 % against 30 %);
 * - `noBlindOpen`: opening an untouched border with nothing in hand to make it
 *   trips or a suited run costs `noBlindOpen` (4 % against 18 %).
 *
 * `stay` can be narrowed (each setting off when absent): `stayCard` 2 or 3,
 * only that card of the side; `stayFigure`, only while the side can still
 * become trips or a suited run; `stayUntil` / `stayFrom`, only up to or from
 * that turn; `stayBehind`, only while the opponent has started as many
 * borders as I have, or more.
 *
 * The other two traits need no new code: sides with no figure (33 % against
 * 9 %) are `junk` with a negative weight, more jokers (14 % against 4 %) a
 * core without the `joker` habit.
 */
export const ORACLE_IDEAS = Object.freeze(["stay", "noAnswer", "noBlindOpen"]);

export const anyOracleIdea = (ideas) => ideas.has("stay") || ideas.has("noAnswer") || ideas.has("noBlindOpen");

/** Another card of the hand that makes `card` the start of trips or of a suited run (as `startsOf`, move-features.js). */
function plannedStart(spec, hand, card) {
  if (isJoker(card)) return true;
  const [value, color] = [valueOf(spec, card), colorOf(spec, card)];
  return hand.some((other) => other !== card && !isJoker(other) && (valueOf(spec, other) === value || (colorOf(spec, other) === color && Math.abs(valueOf(spec, other) - value) === 1)));
}

const started = (sides) => sides.filter((side) => side.length > 0).length;

/** Is it a turn `stay` counts on, and a board it counts on? */
function stayMoment({ weights, turn, mySides, theirSides }) {
  if (weights.stayUntil && turn > weights.stayUntil) return false;
  if (weights.stayFrom && turn < weights.stayFrom) return false;
  return !weights.stayBehind || started(theirSides) >= started(mySides);
}

/** Is it a card `stay` counts: the right one of the side, on a side that keeps a figure if asked? */
function stayCard({ spec, weights }, mine, card) {
  if (weights.stayCard && mine.length + 1 !== weights.stayCard) return false;
  if (!weights.stayFigure) return true;
  const side = [...mine, card];
  // With fewer than two real cards a side can still become anything.
  return side.filter((other) => !isJoker(other)).length < 2 || shapeOf(spec, side) !== null;
}

const stayBonus = (context, mine, card) => (stayMoment(context) && stayCard(context, mine, card) ? context.weights.stay : 0);

export function oracleBonus(context, border, card) {
  const { ideas, weights } = context;
  if (!gateOn(context, "oracle", anyOracleIdea)) return 0;
  const [mine, theirs] = [context.mySides[border], context.theirSides[border]];
  if (mine.length > 0) return ideas.has("stay") ? stayBonus(context, mine, card) : 0;
  if (theirs.length > 0) return ideas.has("noAnswer") ? -weights.noAnswer : 0;
  return ideas.has("noBlindOpen") && !plannedStart(context.spec, context.hand, card) ? -weights.noBlindOpen : 0;
}
