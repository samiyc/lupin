import { DECKS, DECK_IDS, JOKER_RULES, JOKER_RULE_IDS } from "../config/decks.js";
import { ORDERS } from "../config/formations.js";
import { SEED } from "../config/simulations.js";
import { enumerateTriples, inversions, rarityOrder } from "../core/combinatorics.js";
import { createRng } from "../core/random.js";
import { outsTable, sampleStartingHands } from "../core/starting-hand.js";

/**
 * Everything the reports print, computed here and nowhere else. The build
 * script only adds I/O and the thread pool around these functions.
 */

/** Joker rules only mean something for a deck that has jokers. */
export const rulesFor = (deckId) => (DECKS[deckId].jokers > 0 ? JOKER_RULE_IDS : ["free"]);

function exactFor(deckId, ruleId) {
  return Object.fromEntries(
    Object.entries(ORDERS).map(([orderId, order]) => {
      const counts = enumerateTriples(DECKS[deckId], order, JOKER_RULES[ruleId]);
      return [
        orderId,
        { ...counts, inversions: inversions(counts.best, order), rarity: rarityOrder(counts.best) },
      ];
    }),
  );
}

const byDeckAndRule = (compute) =>
  Object.fromEntries(
    DECK_IDS.map((deckId) => [
      deckId,
      Object.fromEntries(rulesFor(deckId).map((ruleId) => [ruleId, compute(deckId, ruleId)])),
    ]),
  );

export const computeExact = () => byDeckAndRule(exactFor);

export const computeOuts = () =>
  byDeckAndRule((deckId, ruleId) => outsTable(DECKS[deckId], JOKER_RULES[ruleId]));

export function computeStartingHands(samples) {
  let offset = 0;
  return byDeckAndRule((deckId, ruleId) => {
    offset += 1;
    return sampleStartingHands(DECKS[deckId], {
      jokerRule: JOKER_RULES[ruleId],
      samples,
      rng: createRng(SEED + offset),
    });
  });
}
