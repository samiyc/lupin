import { colorOf, isJoker, valueOf } from "../core/cards.js";

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
 * The other two traits need no new code: sides with no figure (33 % against
 * 9 %) are `junk` with a negative weight, more jokers (14 % against 4 %) a
 * core without the `joker` habit.
 */
export const ORACLE_IDEAS = Object.freeze(["stay", "noAnswer", "noBlindOpen"]);

const anyOracleIdea = (ideas) => ideas.has("stay") || ideas.has("noAnswer") || ideas.has("noBlindOpen");

/** Another card of the hand that makes `card` the start of trips or of a suited run (as `startsOf`, move-features.js). */
function plannedStart(spec, hand, card) {
  if (isJoker(card)) return true;
  const [value, color] = [valueOf(spec, card), colorOf(spec, card)];
  return hand.some((other) => other !== card && !isJoker(other) && (valueOf(spec, other) === value || (colorOf(spec, other) === color && Math.abs(valueOf(spec, other) - value) === 1)));
}

export function oracleBonus(context, border, card) {
  const { ideas, weights } = context;
  if (!anyOracleIdea(ideas)) return 0;
  const [mine, theirs] = [context.mySides[border], context.theirSides[border]];
  if (mine.length > 0) return ideas.has("stay") ? weights.stay : 0;
  if (theirs.length > 0) return ideas.has("noAnswer") ? -weights.noAnswer : 0;
  return ideas.has("noBlindOpen") && !plannedStart(context.spec, context.hand, card) ? -weights.noBlindOpen : 0;
}
