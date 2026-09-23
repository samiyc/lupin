import { colorOf, isJoker, valueOf } from "../../src/core/cards.js";
import { suitOrder } from "./view.js";

/**
 * The order the player keeps their hand in. The engine's hand is a bag of
 * card ids (two jokers share one id); the page shows it in the player's own
 * order, which survives plays and draws. Pure: tested under Node.
 */

/** Keeps `order`'s cards that are still in `hand`, then appends the new ones. */
export function syncOrder(order, hand) {
  const left = new Map();
  for (const card of hand) left.set(card, (left.get(card) ?? 0) + 1);
  const kept = [];
  for (const card of order) {
    if ((left.get(card) ?? 0) > 0) {
      kept.push(card);
      left.set(card, left.get(card) - 1);
    }
  }
  const added = [];
  for (const card of hand) {
    if (left.get(card) > 0) {
      added.push(card);
      left.set(card, left.get(card) - 1);
    }
  }
  return [...kept, ...added];
}

/** Moves the card at `from` so it lands at `to` (both indices in `order`). */
export function moveCard(order, from, to) {
  if (from === to || from < 0 || from >= order.length) return [...order];
  const next = [...order];
  const [card] = next.splice(from, 1);
  next.splice(Math.max(0, Math.min(to, next.length)), 0, card);
  return next;
}

const jokerLast = (spec, key) => (card) => (isJoker(card) ? Infinity : key(card));

/** ♠ ♥ ♣ ♦ (black and red alternating), low to high inside a suit, jokers at the end. */
export function sortBySuit(spec, order) {
  const rank = suitOrder(spec);
  const key = jokerLast(spec, (card) => rank.indexOf(colorOf(spec, card)) * 100 + valueOf(spec, card));
  return [...order].sort((a, b) => key(a) - key(b));
}

/** Low to high, suits side by side for each value, jokers at the end. */
export function sortByValue(spec, order) {
  const key = jokerLast(spec, (card) => valueOf(spec, card) * 10 + colorOf(spec, card));
  return [...order].sort((a, b) => key(a) - key(b));
}
