/**
 * The matches the report plays out. Decks without jokers have one row; the
 * decks with jokers get every joker rule. The four-colour deck, whose order is
 * in question, gets every order under the three joker rules that never leave
 * a joker stuck in hand.
 */
const row = (deck, jokerRule, order) => ({
  id: `${deck}-${jokerRule}-${order}`,
  deck,
  jokerRule,
  order,
});

export const SIMULATIONS = Object.freeze([
  row("original", "free", "original"),
  row("rapide", "free", "original"),
  ...["original", "swapped", "straightUp", "bothSwapped"].flatMap((order) => [
    row("classique", "free", order),
    row("classique", "onePerBorder", order),
    row("classique", "colorless", order),
  ]),
  row("classique", "onePerPlayer", "original"),
  row("tarot", "free", "original"),
  row("tarot", "onePerBorder", "original"),
  row("tarot", "onePerPlayer", "original"),
  row("tarot", "colorless", "original"),
]);

export const SAMPLE_SIZES = Object.freeze({
  full: { games: 2000, baselineGames: 1000, startingHands: 200000 },
  quick: { games: 150, baselineGames: 100, startingHands: 20000 },
});

export const SEED = 20260922;
