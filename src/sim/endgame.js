import { applyMove, legalMoves } from "./game.js";
import { cloneState } from "./lookahead.js";

/**
 * Solving the end of a game exactly. Once the pile is empty nothing is hidden
 * any more — each hand is what the other cannot see — so the rest of the game
 * is a finite game of perfect information: negamax over every legal move,
 * with memory, stopping at the first winning move since nothing beats a win.
 * The borders settle at the end in the order they filled (`endMode: final`),
 * as in the page.
 *
 * Values are seen from the player to move: 1 a win, 0 a draw, -1 a loss.
 */
const cardsLeft = (state) => state.hands[0].length + state.hands[1].length;

/**
 * What decides the rest of the game from here: hands, sides, whose turn, and
 * the ORDER in which sides filled — only the order matters for ties and for
 * the settling order, so positions reached by moves played in another order
 * share one entry.
 */
const sortedText = (cards) => [...cards].sort((a, b) => a - b).join(",");

function keyOf(state) {
  const hands = state.hands.map(sortedText).join("|");
  const filled = [...new Set(state.borders.flatMap((border) => border.completedAt).filter(Number.isFinite))].sort((a, b) => a - b);
  const rank = (turn) => (Number.isFinite(turn) ? filled.indexOf(turn) : "-");
  const borders = state.borders.map((border) => `${border.sides.map(sortedText).join("/")}@${border.completedAt.map(rank).join("/")}`).join(";");
  return `${state.current}#${state.passes}#${hands}#${borders}`;
}

function outcome(state, player) {
  if (state.winner === null) return 0;
  return state.winner === player ? 1 : -1;
}

/** Negamax value of `state` for the player to move, memoised in `memo`. */
function negamax(state, memo, counter) {
  if (state.over) return outcome(state, state.current);
  const key = keyOf(state);
  const known = memo.get(key);
  if (known !== undefined) return known;
  counter.nodes += 1;
  const moves = legalMoves(state);
  let best = -Infinity;
  for (const move of moves.length > 0 ? moves : [null]) {
    const next = cloneState(state);
    applyMove(next, move);
    // The turn always passes to the other player, so their value is the opposite of ours.
    const value = next.over ? outcome(next, state.current) : -negamax(next, memo, counter);
    best = Math.max(best, value);
    if (best === 1) break;
  }
  memo.set(key, best);
  return best;
}

/**
 * Every legal move of `state` with its exact value for the player to move,
 * best first, plus the number of positions examined. Meant for positions
 * with an empty pile (the solver reads the pile as it lies).
 */
export function solveEndgame(state) {
  const memo = new Map();
  const counter = { nodes: 0 };
  const player = state.current;
  const moves = legalMoves(state).map((move) => {
    const next = cloneState(state);
    applyMove(next, move);
    const value = next.over ? outcome(next, player) : -negamax(next, memo, counter);
    return { move, value };
  });
  moves.sort((a, b) => b.value - a.value);
  return { moves, value: moves[0]?.value ?? 0, nodes: counter.nodes, cardsLeft: cardsLeft(state) };
}

/** The moves that reach the best value — the puzzle's solutions. */
export const bestMoves = (solution) => solution.moves.filter((entry) => entry.value === solution.value).map((entry) => entry.move);
