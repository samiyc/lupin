import { JOKER, cardOf, colorOf, isJoker, valueOf } from "./cards.js";
import { figureByText, figureOf, isFigure } from "./figures.js";

/**
 * Cards as people write them: "7♥", "10♠", "JK". Used by the transcribed real
 * games, the replay logs and the web page, so the three read each other.
 */
export const JOKER_TEXT = "JK";

export function formatCard(spec, card) {
  if (isJoker(card)) return JOKER_TEXT;
  // The extension's figures (figures.js): « V♣ », « D♥ »…
  if (isFigure(card)) return figureOf(card).text;
  return `${valueOf(spec, card)}${spec.suits[colorOf(spec, card)]}`;
}

export function parseCard(spec, text) {
  if (text === JOKER_TEXT) return JOKER;
  const figure = figureByText(text);
  if (figure) return figure.id;
  const suit = spec.suits.indexOf(text.slice(-1));
  const value = Number(text.slice(0, -1));
  if (suit < 0 || !Number.isInteger(value) || value < 1 || value > spec.values) {
    throw new Error(`Carte illisible : « ${text} »`);
  }
  return cardOf(spec, suit, value);
}

export const formatCards = (spec, cards) => cards.map((card) => formatCard(spec, card));

export const parseCards = (spec, texts) => texts.map((text) => parseCard(spec, text));

/** Suit, then value, jokers last: how a hand reads best. */
export function bySuitThenValue(spec) {
  // Jokers after the cards, figures after the jokers.
  const key = (card) => {
    if (isFigure(card)) return 2e6 + card;
    return isJoker(card) ? 1e6 : colorOf(spec, card) * 100 + valueOf(spec, card);
  };
  return (a, b) => key(a) - key(b);
}
