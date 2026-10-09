import { FIGURE_IDS, figureOf, isFigure } from "../../src/core/figures.js";
import { createRng } from "../../src/core/random.js";

/**
 * The extension in the page (docs/extension.md): which figures join a new
 * game, and how a figure is laid with the mouse. Every figure goes beside a
 * border like a card goes on it — but the Dame de Cœur, which takes two
 * clicks: her border, then the border she swaps it with. Pure, so tested.
 */
export const isSwap = (card) => isFigure(card) && figureOf(card).key === "swap";
export const isMinusTen = (card) => isFigure(card) && (figureOf(card).key === "minusTen" || figureOf(card).key === "weakest");

/** The `bonus` figures (0 to 6) of a new game, drawn from its seed apart from the deal: none leaves the base game as it was. */
export const figuresFor = (seed, bonus) => (bonus > 0 ? createRng(seed ^ 0x2f6a).shuffle([...FIGURE_IDS]).slice(0, bonus) : []);

/** The borders `card` may go to now — or, a Dame de Cœur waiting beside `pending.border`, the borders she may swap it with. */
export function bordersFor(moves, card, pending) {
  if (pending?.action === "discard") return new Set([pending.border]);
  const own = moves.filter((move) => move.card === card);
  if (pending && isSwap(card)) return new Set(own.filter((move) => move.border === pending.border).map((move) => move.target));
  return new Set(own.map((move) => move.border));
}

const stepSwap = (card, border, pending) => (!pending ? { pending: { border } } : { move: { card, border: pending.border, target: border } });

const stepMinusTen = (card, border, pending, ctx) => {
  if (ctx?.pile === 0) return { move: { card, border } };
  if (!pending) return { pending: { card, border, action: "discard" } };
  if (pending.action === "discard" && pending.border === border) return { move: { card, border } };
  return { move: { card, border } };
};

/** A click on `border` with `card`: the move to play, or — Dame de Cœur / Valet de Trèfle — the pending step. */
export function stepOf(card, border, pending, ctx = null) {
  if (isSwap(card)) return stepSwap(card, border, pending);
  if (isMinusTen(card)) return stepMinusTen(card, border, pending, ctx);
  return { move: { card, border } };
}
