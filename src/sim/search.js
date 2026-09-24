import { createRng } from "../core/random.js";
import { applyMove } from "./game.js";
import { cloneState, determinize, playOut } from "./lookahead.js";

/**
 * A deeper look ahead than `lookahead.js`, for the experimental bot: more
 * candidates, and rollouts spent where they matter.
 *
 * The core shortlists `candidates` moves. Each step deals the unseen cards
 * once and plays that deal out after every candidate still in the race
 * (common random numbers, as in `lookahead.js`). Once every survivor has
 * `phase` rollouts, the worse half is dropped and `phase` doubles — successive
 * halving: most rollouts go to the two or three moves worth separating. The
 * search stops when its budget runs out, or as soon as one survivor leads
 * the other by more than `confidence` standard errors: an obvious move is
 * played fast.
 *
 * A search is a plain object advanced by `step()`, so the page can run it
 * a little at a time — in a worker, and during the human's turn.
 */
export const SEARCH = Object.freeze({ candidates: 8, firstPhase: 8, prior: 0.3, confidence: 3 });

export const moveKey = (move) => (move ? `${move.card}@${move.border}` : "pass");

/**
 * An arm's starting statistics: nothing, or a head start from pondering
 * (`warm`, by move key), scaled to `warmWeight` of its rollouts and at most
 * `warmCap` of them.
 */
function armFor(entry, { warm, warmWeight = 0.5, warmCap = 64 }) {
  const known = warm?.get(moveKey(entry.move));
  if (!known) return { entry, points: 0, plays: 0 };
  const plays = Math.min(known.plays * warmWeight, warmCap);
  return { entry, points: (known.points / known.plays) * plays, plays };
}

const pointsFor = (winner, player) => {
  if (winner === null) return 0.5;
  return winner === player ? 1 : 0;
};

const rating = (arm, prior) => arm.points / Math.max(1, arm.plays) + prior * arm.entry.gain;

/** Is the leader clearly ahead of the runner-up (normal approximation)? */
function settled([first, second], prior, confidence) {
  if (!second || first.plays < 16) return !second;
  const p = (first.points + second.points) / (first.plays + second.plays);
  const error = Math.sqrt(Math.max(p * (1 - p), 0.05) * (1 / first.plays + 1 / second.plays));
  return rating(first, prior) - rating(second, prior) > confidence * error;
}

/**
 * Starts a search in `state` for the player to move. `scored`: the core's
 * `scoreMoves` output; `policy(rng)`: builds the rollout bot; `seed`: fixes
 * the deals, so the same position searched with the same budget gives the
 * same answer.
 */
export function createSearch(state, scored, { policy, seed, warm = null, ...settings }) {
  const { candidates, firstPhase, prior, confidence } = { ...SEARCH, ...settings };
  const player = state.current;
  const ranked = [...scored].sort((a, b) => Number(Boolean(a.refused)) - Number(Boolean(b.refused)) || b.gain - a.gain);
  const arms = ranked.slice(0, candidates).map((entry) => armFor(entry, { warm, ...settings }));
  const deals = createRng(seed);
  const rollout = policy(createRng(deals.int(2 ** 31)));
  let alive = arms;
  let phase = firstPhase;
  let rollouts = 0;
  const byRating = (list) => [...list].sort((a, b) => rating(b, prior) - rating(a, prior));
  return {
    /** One deal, played out after every surviving candidate. */
    step() {
      if (alive.length <= 1) return;
      const deal = determinize(state, player, deals);
      for (const arm of alive) {
        const game = cloneState(deal);
        applyMove(game, arm.entry.move);
        arm.points += pointsFor(playOut(game, rollout), player);
        arm.plays += 1;
      }
      rollouts += alive.length;
      if (alive.every((arm) => arm.plays >= phase) && alive.length > 2) {
        alive = byRating(alive).slice(0, Math.ceil(alive.length / 2));
        phase *= 2;
      }
    },
    /** Nothing left to learn: one survivor, or a clear leader. */
    done: () => alive.length <= 1 || settled(byRating(alive), prior, confidence),
    rollouts: () => rollouts,
    /** The best surviving move. */
    best: () => byRating(alive)[0].entry.move,
    scored: () => searchScores(scored, arms, alive, prior),
  };
}

/**
 * Every candidate with its gain: survivors rated first, then the dropped ones
 * (below any survivor), then the moves never shortlisted.
 */
function searchScores(scored, arms, alive, prior) {
  const rated = new Map(arms.map((arm) => [arm.entry, arm]));
  return scored.map((entry) => {
    const arm = rated.get(entry);
    if (!arm) return { ...entry, gain: -2 + entry.gain / 100 };
    const survivor = alive.includes(arm);
    return { ...entry, gain: rating(arm, prior) - (survivor ? 0 : 1), rollouts: arm.plays };
  });
}

/**
 * The experimental bot: a search per move, stopped by `budget` rollouts —
 * deterministic, for duels — or by `stop()`, which the page sets to a
 * deadline. The base bot shortlists; `policy(rng)` plays the rollouts.
 */
export function searchBot(rng, { base, policy, budget = 400, stop = null, name = "search", ...settings }) {
  const seed = rng.int(2 ** 31);
  const searchFor = (state, moves, options, extra = {}) =>
    createSearch(state, base.scoreMoves(state, moves, options), { policy, seed: seed ^ Math.imul(state.turn + 1, 2654435761), ...settings, ...extra });
  const run = (search) => {
    while (!search.done() && (stop ? !stop(search) : search.rollouts() < budget)) search.step();
    return search;
  };
  return {
    name,
    base,
    policy,
    searchFor,
    scoreMoves: (state, moves, options = {}) => (moves.length <= 1 ? base.scoreMoves(state, moves, options) : run(searchFor(state, moves, options)).scored()),
    choose: (state, moves) => (moves.length <= 1 ? moves[0] : run(searchFor(state, moves, {})).best()),
  };
}
