import { isJoker } from "../core/cards.js";
import { legalMoves } from "./game.js";
import { cloneState, determinize } from "./lookahead.js";

/**
 * A model of the opponent (since 0.8 candidates): deals of the unseen cards
 * weighed by the opponent's last move. A deal that gives them a hand in which
 * that move would have been a blunder is unlikely — they did not play that
 * way holding those cards. The weight is exp((gain of the move played − best
 * gain) / temperature), both by the rollout policy's own judgement; a deal is
 * kept with that probability, redealt otherwise, `tries` times at most.
 */

/** The opponent's position just before their last move, with the hand `deal` gives them (plus the card played). */
function beforeLastMove(deal, opponent) {
  const move = deal.lastMoves?.[opponent];
  const border = move && deal.borders[move.border];
  if (!border || border.sides[opponent].at(-1) !== move.card) return null;
  const view = cloneState(deal);
  const sides = border.sides.map((side, seat) => (seat === opponent ? side.slice(0, -1) : side));
  view.borders[move.border] = { sides, completedAt: [...border.completedAt], owner: null };
  view.hands[opponent] = [...deal.hands[opponent], move.card];
  if (isJoker(move.card)) view.jokersPlayed[opponent] -= 1;
  view.current = opponent;
  return { view, move };
}

/** How plausible the opponent's last move is, if `deal` is how things lie: 1 for their favourite. */
export function likelihood(deal, opponent, judge, temperature) {
  const before = beforeLastMove(deal, opponent);
  if (!before) return 1;
  const scored = judge.scoreMoves(before.view, legalMoves(before.view));
  const played = scored.find(({ move }) => move.card === before.move.card && move.border === before.move.border);
  if (!played) return 1;
  const best = Math.max(...scored.map(({ gain }) => gain));
  return Math.exp((played.gain - best) / temperature);
}

/** A deal of the unseen cards for `player`, filtered by the opponent's last move. */
export function modelledDeal(state, player, rng, { judge, temperature, tries = 8 }) {
  let deal = determinize(state, player, rng);
  for (let attempt = 1; attempt < tries && rng.next() > likelihood(deal, 1 - player, judge, temperature); attempt += 1) {
    deal = determinize(state, player, rng);
  }
  return deal;
}
