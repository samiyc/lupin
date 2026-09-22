/**
 * Every deck the study compares, as data only.
 *
 * `borders × 6 === cards` for every playable deck: the whole deck fits the
 * board exactly, which is the property the 42-card design started from.
 * The two `reference` decks drop the jokers to isolate their effect; they
 * have 40 cards for 42 slots and are therefore never simulated.
 */
const SEVEN_BORDERS = Object.freeze({ borders: 7, majority: 4, adjacent: 3 });

export const DECKS = Object.freeze({
  original: {
    id: "original",
    label: "Original",
    detail: "6 couleurs × 1-9",
    colors: 6,
    values: 9,
    jokers: 0,
    borders: 9,
    majority: 5,
    adjacent: 3,
    handSize: 6,
    suits: ["R", "O", "J", "V", "B", "P"],
    material: "Schotten Totten (54 cartes)",
  },
  rapide: {
    id: "rapide",
    label: "Rapide",
    detail: "6 couleurs × 1-7",
    colors: 6,
    values: 7,
    jokers: 0,
    ...SEVEN_BORDERS,
    handSize: 6,
    suits: ["R", "O", "J", "V", "B", "P"],
    material: "Schotten Totten sans les 8 et 9",
  },
  classique: {
    id: "classique",
    label: "Classique",
    detail: "4 couleurs × 1-10 + 2 jokers",
    colors: 4,
    values: 10,
    jokers: 2,
    ...SEVEN_BORDERS,
    handSize: 6,
    suits: ["♠", "♥", "♦", "♣"],
    material: "Jeu de 52 cartes sans Valets, Dames, Rois (As = 1) + 2 jokers",
  },
  tarot: {
    id: "tarot",
    label: "Tarot",
    detail: "5 couleurs × 1-8 + 2 atouts libres",
    colors: 5,
    values: 8,
    jokers: 2,
    ...SEVEN_BORDERS,
    handSize: 6,
    suits: ["♠", "♥", "♦", "♣", "★"],
    material: "Jeu de tarot : 4 couleurs de 1 à 8, atouts 1 à 8, Excuse et 21 libres",
  },
  classiqueSansJoker: {
    id: "classiqueSansJoker",
    label: "Classique sans joker",
    detail: "4 couleurs × 1-10",
    colors: 4,
    values: 10,
    jokers: 0,
    ...SEVEN_BORDERS,
    handSize: 6,
    suits: ["♠", "♥", "♦", "♣"],
    reference: true,
    material: "Témoin : le Classique sans ses jokers",
  },
  tarotSansJoker: {
    id: "tarotSansJoker",
    label: "Tarot sans atout libre",
    detail: "5 couleurs × 1-8",
    colors: 5,
    values: 8,
    jokers: 0,
    ...SEVEN_BORDERS,
    handSize: 6,
    suits: ["♠", "♥", "♦", "♣", "★"],
    reference: true,
    material: "Témoin : le Tarot sans ses atouts libres",
  },
});

/** Display order in every report. */
export const DECK_IDS = Object.freeze([
  "original",
  "rapide",
  "classiqueSansJoker",
  "classique",
  "tarotSansJoker",
  "tarot",
]);

/**
 * How jokers may be placed. `maxPerSide` caps jokers on one player's side of
 * one border; `maxPerPlayer` caps them over the whole game.
 */
export const JOKER_RULES = Object.freeze({
  free: { id: "free", label: "Jokers libres", maxPerSide: 3, maxPerPlayer: 3 },
  onePerBorder: {
    id: "onePerBorder",
    label: "1 joker max par borne",
    maxPerSide: 1,
    maxPerPlayer: 3,
  },
  onePerPlayer: {
    id: "onePerPlayer",
    label: "1 joker max par joueur",
    maxPerSide: 1,
    maxPerPlayer: 1,
  },
});

export const JOKER_RULE_IDS = Object.freeze(Object.keys(JOKER_RULES));
