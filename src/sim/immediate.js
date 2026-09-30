import { isClaimable } from "./certainty.js";
import { applyMove } from "./game.js";
import { cloneState } from "./lookahead.js";

/**
 * A win that cannot be stopped, under the claim rule: after `move`, the
 * opponent has not won with their own claims, and the borders the mover can
 * then prove — from the cards on the table alone, so whatever the opponent
 * holds — already make three in a row or a majority. The opponent's reply
 * cannot undo a proof (it only takes cards off what they could still play),
 * so the mover claims the game at the start of their next turn. Such
 * positions make mid-game puzzles, hidden cards and all.
 */
function longestRun(flags) {
  let best = 0;
  let run = 0;
  for (const flag of flags) {
    run = flag ? run + 1 : 0;
    best = Math.max(best, run);
  }
  return best;
}

export function winsAtNextClaim(state, move) {
  const player = state.current;
  const next = cloneState(state);
  next.endMode = "claim";
  applyMove(next, move);
  if (next.over) return next.winner === player;
  const owned = next.borders.map((border, index) => border.owner === player || isClaimable(next, index, player));
  return longestRun(owned) >= state.spec.adjacent || owned.filter(Boolean).length >= state.spec.majority;
}
