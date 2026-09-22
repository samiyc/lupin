import { realCardCount } from "./cards.js";

/**
 * The card ids a wild slot may become.
 *
 * A normal joker becomes any real card. A colourless joker becomes a value
 * with no suit: those are extra ids `n .. n + values - 1`, which `colorOf`
 * reads as a phantom suit `spec.colors` that no real card shares — so it can
 * never complete a flush, since at least one real card sits beside it.
 * `valueOf` reads their value correctly with no special case.
 *
 * `any` is always the real cards: it stands for a card still to be drawn.
 */
export function cardSpace(spec, jokerRule) {
  const n = realCardCount(spec);
  const colorless = Boolean(jokerRule?.colorless);
  const m = colorless ? n + spec.values : n;
  return {
    m,
    key: colorless ? "colorless" : "coloured",
    any: [0, n],
    joker: colorless ? [n, m] : [0, n],
  };
}

/** Every id a joker may stand for, as a list: the brute-force view. */
export function jokerStandIns(spec, jokerRule) {
  const [low, high] = cardSpace(spec, jokerRule).joker;
  return Array.from({ length: high - low }, (_, i) => low + i);
}
