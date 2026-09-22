import { FORMATIONS, PATTERNS } from "../config/formations.js";
import { buildDeck, isJoker } from "./cards.js";
import { getEvaluator, getReachability } from "./evaluator.js";
import { hasFormation } from "./formations.js";

export const choose = (n, k) => {
  if (k < 0 || k > n) return 0;
  let result = 1;
  for (let i = 1; i <= k; i += 1) result = (result * (n - k + i)) / i;
  return Math.round(result);
};

const zeroCounts = () => Object.fromEntries(FORMATIONS.map((f) => [f, 0]));

function forEachTriple(deck, visit) {
  for (let i = 0; i < deck.length; i += 1) {
    for (let j = i + 1; j < deck.length; j += 1) {
      for (let k = j + 1; k < deck.length; k += 1) visit(deck[i], deck[j], deck[k]);
    }
  }
}

/**
 * Every 3-card hand of the deck, once. `best` counts the formation each hand
 * is worth under `order` (exclusive, sums to `total`); `reachable` counts the
 * hands that *could* show each pattern (non-exclusive). Hands carrying more
 * jokers than `jokerRule.maxPerSide` cannot exist on the board, so they are
 * left out of the population rather than forced into a formation.
 */
export function enumerateTriples(spec, order, jokerRule) {
  const evaluator = getEvaluator(spec, order, jokerRule);
  const reach = getReachability(spec, jokerRule);
  const best = zeroCounts();
  const reachable = zeroCounts();
  let total = 0;
  let excluded = 0;
  forEachTriple(buildDeck(spec), (a, b, c) => {
    const hand = [a, b, c];
    if (hand.filter(isJoker).length > jokerRule.maxPerSide) {
      excluded += 1;
      return;
    }
    total += 1;
    best[evaluator.formation(hand)] += 1;
    const mask = reach.mask(hand);
    for (const f of FORMATIONS) if (hasFormation(mask, f)) reachable[f] += 1;
  });
  return { total, excluded, best, reachable };
}

/**
 * The same counts for a deck without jokers, from formulas instead of
 * enumeration. The tests hold the two methods against each other.
 */
export function closedFormCounts(spec) {
  const { colors: c, values: v } = spec;
  const straightFlush = c * (v - 2);
  const threeOfAKind = v * choose(c, 3);
  const flush = c * choose(v, 3) - straightFlush;
  const straight = (v - 2) * c ** 3 - straightFlush;
  const total = choose(c * v, 3);
  const sum = total - straightFlush - threeOfAKind - flush - straight;
  return { total, best: { straightFlush, threeOfAKind, flush, straight, sum } };
}

/**
 * Pairs of formations ranked the wrong way round by rarity: `stronger` beats
 * `weaker` in `order`, yet is at least as common. The sum is left out — it is
 * the fallback, not a pattern.
 */
export function inversions(counts, order) {
  const ranked = order.filter((f) => PATTERNS.includes(f));
  const found = [];
  ranked.forEach((stronger, i) => {
    for (const weaker of ranked.slice(i + 1)) {
      if (counts[stronger] >= counts[weaker]) found.push({ stronger, weaker });
    }
  });
  return found;
}

/** Patterns from rarest to most common: the order rarity alone suggests. */
export const rarityOrder = (counts) =>
  [...PATTERNS].sort((x, y) => counts[x] - counts[y]).concat("sum");
