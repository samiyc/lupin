import { FIGURE_IDS, figureOf, isFigure } from "../../src/core/figures.js";
import { createRng } from "../../src/core/random.js";

/**
 * The extension in the page (docs/extension.md): which figures join a new
 * game, and how a figure is laid with the mouse. Every figure goes beside a
 * border like a card goes on it — but the Dame de Cœur, which takes two
 * clicks: her border, then the border she swaps it with. Pure, so tested.
 */
export const isSwap = (card) => isFigure(card) && figureOf(card).key === "swap";

/** The `bonus` figures (0 to 6) of a new game, drawn from its seed apart from the deal: none leaves the base game as it was. */
export const figuresFor = (seed, bonus) => (bonus > 0 ? createRng(seed ^ 0x2f6a).shuffle([...FIGURE_IDS]).slice(0, bonus) : []);

/** The borders `card` may go to now — or, a Dame de Cœur waiting beside `pending.border`, the borders she may swap it with. */
export function bordersFor(moves, card, pending) {
  const own = moves.filter((move) => move.card === card);
  if (pending && isSwap(card)) return new Set(own.filter((move) => move.border === pending.border).map((move) => move.target));
  return new Set(own.map((move) => move.border));
}

/** A click on `border` with `card`: the move to play, or — the Dame de Cœur's first click — the border she waits beside. */
export function stepOf(card, border, pending) {
  if (!isSwap(card)) return { move: { card, border } };
  if (!pending) return { pending: { border } };
  return { move: { card, border: pending.border, target: border } };
}
