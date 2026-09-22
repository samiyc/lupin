/**
 * Cards are small integers so that every lookup table can be a flat array:
 * a real card is `color * values + (value - 1)`, a joker is `JOKER`.
 */
export const JOKER = -1;

export const isJoker = (card) => card === JOKER;

export const realCardCount = (spec) => spec.colors * spec.values;

export const cardOf = (spec, color, value) => color * spec.values + (value - 1);

export const colorOf = (spec, card) => Math.floor(card / spec.values);

export const valueOf = (spec, card) => (card % spec.values) + 1;

/** The full deck, real cards first, then the jokers. */
export function buildDeck(spec) {
  const deck = [];
  for (let card = 0; card < realCardCount(spec); card += 1) deck.push(card);
  for (let i = 0; i < spec.jokers; i += 1) deck.push(JOKER);
  return deck;
}

/** Human-readable card, e.g. "7♥" or "Jk". */
export function cardLabel(spec, card) {
  if (isJoker(card)) return "Jk";
  return `${valueOf(spec, card)}${spec.suits[colorOf(spec, card)]}`;
}
