import { readFileSync } from "node:fs";
import { DECKS, JOKER_RULES } from "../config/decks.js";
import { parseCard } from "../core/notation.js";

/**
 * The real games transcribed from Sami's photos (`data/irl/essais.json`).
 * A column is a string such as "8♣ 6♣ 3♣" or "10♦ 10♥ JK", top card first.
 */
const SOURCE = new URL("../../data/irl/essais.json", import.meta.url);

export { parseCard };

export const parseColumn = (spec, column) =>
  column.trim().split(/\s+/).map((text) => parseCard(spec, text));

/** `{ spec, jokerRule, games: [{ photo, lines: { haut, bas } }] }`, cards as ids. */
export function loadEssais(path = SOURCE) {
  const raw = JSON.parse(readFileSync(path, "utf8"));
  const spec = DECKS[raw.deck];
  const games = raw.games.map((game) => ({
    photo: game.photo,
    lines: {
      haut: game.haut.map((column) => parseColumn(spec, column)),
      bas: game.bas.map((column) => parseColumn(spec, column)),
    },
  }));
  return { spec, jokerRule: JOKER_RULES[raw.jokerRule], games };
}
