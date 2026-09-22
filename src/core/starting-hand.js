import { PATTERNS } from "../config/formations.js";
import { buildDeck, cardOf, isJoker, realCardCount } from "./cards.js";
import { getReachability } from "./evaluator.js";
import { hasFormation } from "./formations.js";

const zeroPatterns = () => Object.fromEntries(PATTERNS.map((f) => [f, 0]));

function combinations(size, k) {
  const out = [];
  const pick = (start, chosen) => {
    if (chosen.length === k) return out.push(chosen);
    for (let i = start; i < size; i += 1) pick(i + 1, [...chosen, i]);
    return out;
  };
  return pick(0, []);
}

function maskOver(hand, groups, allowed, reach) {
  let mask = 0;
  for (const group of groups) {
    const cards = group.map((i) => hand[i]);
    if (allowed(cards)) mask |= reach.mask(cards);
  }
  return mask;
}

/**
 * What a starting hand already holds. `complete` is the share of hands with
 * three cards showing each pattern; `start` the share with two cards any third
 * card could complete. A joker counts only where `jokerRule.maxPerSide` lets
 * it sit, so two jokers never make a trio under "one per border".
 */
export function sampleStartingHands(spec, { jokerRule, samples, rng }) {
  const reach = getReachability(spec);
  const deck = buildDeck(spec);
  const triples = combinations(spec.handSize, 3);
  const pairs = combinations(spec.handSize, 2);
  const allowed = (cards) => cards.filter(isJoker).length <= jokerRule.maxPerSide;
  const complete = zeroPatterns();
  const start = zeroPatterns();
  let anyComplete = 0;
  for (let s = 0; s < samples; s += 1) {
    const hand = rng.shuffle(deck).slice(0, spec.handSize);
    const full = maskOver(hand, triples, allowed, reach);
    const partial = maskOver(hand, pairs, allowed, reach);
    tally(complete, full);
    tally(start, partial);
    if (PATTERNS.some((f) => hasFormation(full, f))) anyComplete += 1;
  }
  const share = (counts) =>
    Object.fromEntries(PATTERNS.map((f) => [f, counts[f] / samples]));
  return { samples, complete: share(complete), start: share(start), anyComplete: anyComplete / samples };
}

function tally(counts, mask) {
  for (const f of PATTERNS) if (hasFormation(mask, f)) counts[f] += 1;
}

/**
 * Outs: how many of the other cards complete a typical two-card start, with
 * the jokers counted separately. Measured by enumeration on a representative
 * pair, not by formula, so a change of deck cannot make it lie.
 */
export function outsTable(spec, jokerRule) {
  const mid = Math.floor(spec.values / 2);
  const at = (color, value) => cardOf(spec, color, value);
  const starts = [
    { id: "pair", label: "Paire", target: "threeOfAKind", cards: [at(0, mid), at(1, mid)] },
    { id: "suitedOpen", label: "Deux qui se suivent, même couleur", target: "straightFlush", cards: [at(0, mid), at(0, mid + 1)] },
    { id: "suitedGap", label: "Suite couleur à trou (ex. 4 et 6)", target: "straightFlush", cards: [at(0, mid), at(0, mid + 2)] },
    { id: "suited", label: "Deux de même couleur", target: "flush", cards: [at(0, 1), at(0, spec.values)] },
    { id: "open", label: "Deux qui se suivent", target: "straight", cards: [at(0, mid), at(1, mid + 1)] },
    { id: "gap", label: "Suite à trou (ex. 4 et 6)", target: "straight", cards: [at(0, mid), at(1, mid + 2)] },
  ];
  const reach = getReachability(spec);
  const jokers = jokerRule.maxPerSide >= 1 ? spec.jokers : 0;
  const unseen = realCardCount(spec) + spec.jokers - 2;
  return starts.map((start) => {
    const real = countRealOuts(spec, reach, start);
    return { ...start, real, jokers, outs: real + jokers, unseen, share: (real + jokers) / unseen };
  });
}

function countRealOuts(spec, reach, { cards, target }) {
  let outs = 0;
  for (let card = 0; card < realCardCount(spec); card += 1) {
    if (cards.includes(card)) continue;
    if (hasFormation(reach.mask([...cards, card]), target)) outs += 1;
  }
  return outs;
}
