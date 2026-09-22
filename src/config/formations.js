/**
 * The five formations of Schotten Totten and the orders the study compares.
 *
 * An order is a list, strongest first. It is a parameter everywhere because
 * with wild cards the best formation a hand can make depends on the ranking —
 * and the ranking is exactly what this project questions.
 */
export const FORMATIONS = Object.freeze([
  "straightFlush",
  "threeOfAKind",
  "flush",
  "straight",
  "sum",
]);

export const FORMATION_LABELS = Object.freeze({
  straightFlush: "Suite couleur",
  threeOfAKind: "Brelan",
  flush: "Couleur",
  straight: "Suite",
  sum: "Somme",
});

/** Short labels for tight ASCII tables. */
export const FORMATION_SHORT = Object.freeze({
  straightFlush: "SC",
  threeOfAKind: "Br",
  flush: "Co",
  straight: "Su",
  sum: "So",
});

export const ORDERS = Object.freeze({
  original: Object.freeze([...FORMATIONS]),
  swapped: Object.freeze([
    "threeOfAKind",
    "straightFlush",
    "flush",
    "straight",
    "sum",
  ]),
});

export const ORDER_LABELS = Object.freeze({
  original: "Ordre d'origine (Suite couleur > Brelan)",
  swapped: "Ordre inversé (Brelan > Suite couleur)",
});

/** The formations that are a real pattern, i.e. everything but the sum. */
export const PATTERNS = Object.freeze(FORMATIONS.filter((f) => f !== "sum"));
