/**
 * The extension's six bonus cards (Sami, 07/10, docs/extension.md). A figure
 * is drawn like any card and counts in the hand of 6; playing it is the
 * turn's move: it goes beside an undecided border, on its player's side, one
 * per border and player, and changes that border's rule. Their ids sit far
 * above every card id (cards 0-39, joker -1, colourless stand-ins 40-49), so
 * no table indexed by card ever meets one by accident.
 *
 * - `scope`: "border" changes the rule for both sides, "own" only for the
 *   player who laid it; "move" acts once, when laid.
 */
export const FIGURE_BASE = 100;

export const FIGURES = Object.freeze([
  Object.freeze({ id: 100, key: "weakest", text: "V♣", name: "Valet de Trèfle", rule: "la plus faible gagne", scope: "border" }),
  Object.freeze({ id: 101, key: "sum", text: "V♦", name: "Valet de Carreau", rule: "la Somme", scope: "border" }),
  Object.freeze({ id: 102, key: "swap", text: "D♥", name: "Dame de Cœur", rule: "l'Échange", scope: "move" }),
  Object.freeze({ id: 103, key: "recall", text: "D♠", name: "Dame de Pique", rule: "le Rappel", scope: "move" }),
  Object.freeze({ id: 104, key: "oddFlush", text: "R♠", name: "Roi de Pique", rule: "la Couleur impaire", scope: "border" }),
  Object.freeze({ id: 105, key: "plusTen", text: "R♦", name: "Roi de Carreau", rule: "+10 aux suites", scope: "own" }),
]);

export const FIGURE_IDS = Object.freeze(FIGURES.map((figure) => figure.id));

export const isFigure = (card) => card >= FIGURE_BASE;

/** The figure of id `card` (`FIGURES`), or undefined for a plain card. */
export const figureOf = (card) => FIGURES[card - FIGURE_BASE];

/** The figure with this key ("weakest", "swap", …). */
export const figureByKey = (key) => FIGURES.find((figure) => figure.key === key);

/** The figure written `text` ("V♣"), or undefined. */
export const figureByText = (text) => FIGURES.find((figure) => figure.text === text);

/** Does the player draw after laying `card`? Always, but after the Dame de Pique: the Rappel gave a card back. */
export const drawsAfter = (card) => !isFigure(card) || figureOf(card).key !== "recall";

/** The cards of `cards` that are not figures: the ones that go on a side. */
export const withoutFigures = (cards) => cards.filter((card) => !isFigure(card));
