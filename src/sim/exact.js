import { solveEndgame } from "./endgame.js";

/**
 * The experimental bot's endgame (since 0.7): once the pile is empty and few
 * cards are left, nothing is hidden any more and the exact solver
 * (`endgame.js`) replaces the search. Up to 8 cards it answers in about
 * 0.1 s (`npm run bench`); at 10 it can take 20 s, more than the page allows.
 *
 * The root moves are tried in the core's order and the first win is kept, so
 * among several wins — or when every move loses, against an opponent who may
 * still slip — the bot plays the one its core prefers.
 */
export const EXACT = Object.freeze({ maxCards: 8 });

const cardsLeft = (state) => state.hands[0].length + state.hands[1].length;

export const exactApplies = (state, maxCards = EXACT.maxCards) => state.pile.length === 0 && cardsLeft(state) <= maxCards;

/**
 * `scored` (the core's `scoreMoves` output) re-rated by the solver: a move's
 * gain becomes its exact value (1 win, 0 draw, -1 loss) plus a hundredth of
 * the core's gain to order equal values; moves left unexamined after the
 * first win rank below every examined one.
 */
export function exactScores(state, scored) {
  const order = [...scored].sort((a, b) => Number(Boolean(a.refused)) - Number(Boolean(b.refused)) || b.gain - a.gain);
  const { moves } = solveEndgame(state, { moves: order.map((entry) => entry.move), stopAtWin: true });
  const values = new Map(moves.map(({ move, value }) => [move, value]));
  return scored.map((entry) => {
    const value = values.get(entry.move);
    return { ...entry, gain: (value ?? -3) + entry.gain / 100, exact: value !== undefined };
  });
}
