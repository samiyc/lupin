import { createRng } from "../core/random.js";
import { applyMove, legalMoves } from "./game.js";
import { unseenCards } from "./potential.js";

/**
 * Looking ahead by playing the game out. The strategist judges a move by what
 * it does to one border; this bot takes the strategist's best few moves and,
 * for each, plays the rest of the game many times — the cards it cannot see
 * (the opponent's hand and the pile) dealt at random each time, both sides
 * then played by a fast policy bot — and keeps the move that wins most often.
 *
 * Every candidate is played out on the same deals (common random numbers),
 * so the comparison between candidates is not drowned in deal-to-deal noise.
 * The deals are seeded from the bot's seed and the turn: scoring the same
 * position twice gives the same answer, so a logged choice can be re-scored.
 */
export const LOOKAHEAD = Object.freeze({ candidates: 4, rollouts: 16, prior: 0.3 });

/** A deep enough copy of a game to play on without touching the original. */
export function cloneState(state) {
  return {
    ...state,
    pile: [...state.pile],
    hands: state.hands.map((hand) => [...hand]),
    borders: state.borders.map((border) => ({ sides: border.sides.map((side) => [...side]), completedAt: [...border.completedAt], owner: border.owner })),
    jokersPlayed: [...state.jokersPlayed],
    resolved: state.resolved.map((entry) => ({ ...entry })),
  };
}

/**
 * The game as `player` might find it: their own hand and the board as they
 * are, the cards they cannot see shuffled into the opponent's hand and the pile.
 */
export function determinize(state, player, rng) {
  const hidden = unseenCards(state, player).entries.flatMap(([card, count]) => Array.from({ length: count }, () => card));
  rng.shuffle(hidden);
  const copy = cloneState(state);
  const theirs = copy.hands[1 - player].length;
  copy.hands[1 - player] = hidden.slice(0, theirs);
  copy.pile = hidden.slice(theirs);
  return copy;
}

/** Plays `game` to its end with `policy` on both sides; returns the winner (or null). */
export function playOut(game, policy) {
  const guard = game.spec.borders * 6 * 3;
  while (!game.over && game.turn < guard) {
    const moves = legalMoves(game);
    applyMove(game, moves.length > 0 ? policy.choose(game, moves) : null);
  }
  return game.winner;
}

const pointsFor = (winner, player) => {
  if (winner === null) return 0.5;
  return winner === player ? 1 : 0;
};

/** The `count` best moves of `scored`, refused ones last. */
function shortlist(scored, count) {
  return [...scored].sort((a, b) => Number(Boolean(a.refused)) - Number(Boolean(b.refused)) || b.gain - a.gain).slice(0, count);
}

/**
 * `base`: the bot whose scores pick the candidates; `policy(rng)`: builds the
 * bot that plays the rollouts (both usually the strategist) — rebuilt on the
 * turn's seed at every scoring, so its tie-breaks repeat too. A candidate's gain becomes
 * its share of won rollouts (0 to 1), plus `prior` times its base score — 16
 * rollouts separate moves only so finely, and the base score carries the
 * habits and ideas; the others rank below every candidate, in base order.
 */
export function lookaheadBot(rng, { base, policy, name = "lookahead", ...settings }) {
  const { candidates, rollouts, prior } = { ...LOOKAHEAD, ...settings };
  const seed = rng.int(2 ** 31);
  const scoreMoves = (state, moves, options = {}) => {
    const scored = base.scoreMoves(state, moves, options);
    if (moves.length <= 1) return scored;
    const player = state.current;
    const picked = shortlist(scored, candidates);
    const points = picked.map(() => 0);
    const deals = createRng(seed ^ Math.imul(state.turn + 1, 2654435761));
    const rollout = policy(createRng(deals.int(2 ** 31)));
    for (let r = 0; r < rollouts; r += 1) {
      const deal = determinize(state, player, deals);
      picked.forEach(({ move }, i) => {
        const game = cloneState(deal);
        applyMove(game, move);
        points[i] += pointsFor(playOut(game, rollout), player);
      });
    }
    const judged = new Map(picked.map((entry, i) => [entry, points[i] / rollouts + prior * entry.gain]));
    return scored.map((entry) => ({ ...entry, gain: judged.has(entry) ? judged.get(entry) : -1 + entry.gain / 100 }));
  };
  return {
    name,
    scoreMoves,
    choose: (state, moves) => {
      const scored = scoreMoves(state, moves);
      const top = Math.max(...scored.map((entry) => entry.gain));
      const best = scored.filter((entry) => entry.gain > top - 1e-9);
      return best[rng.int(best.length)].move;
    },
  };
}
