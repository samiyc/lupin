import { createRng } from "../core/random.js";
import { exactApplies, exactScores } from "./exact.js";
import { applyMove, legalMoves } from "./game.js";
import { determinize, playOut } from "./lookahead.js";
import { moveKey } from "./search.js";

/**
 * A tree search over hidden information (single-observer ISMCTS), the 4th
 * lever of the roadmap. The experimental search judges each of its moves by
 * rollouts alone: what the opponent answers is left to the rollout policy,
 * whose mistakes the search then amplifies. Here every iteration deals the
 * unseen cards afresh, walks a tree of moves — mine, the opponent's reply,
 * mine again, `depth` plies — choosing by UCB1 among the core's `widen` best
 * moves where it stands, and only then plays the game out. A reply is a
 * branch the search can learn about, not a single guess of the policy.
 *
 * The opponent's moves depend on the hand each deal gives them, so a child's
 * exploration term counts the iterations where it was available (`avail`),
 * not its parent's visits. The move played is the root child most visited.
 */
export const ISMCTS = Object.freeze({ budget: 400, candidates: 8, widen: 4, depth: 3, exploration: 0.7 });

const newNode = () => ({ visits: 0, wins: 0, avail: 0, children: new Map() });

const pointsFor = (winner, player) => {
  if (winner === null) return 0.5;
  return winner === player ? 1 : 0;
};

/** The core's `count` best moves where `state` stands, or a pass when there is none. */
function shortlist(judge, state, count) {
  const moves = legalMoves(state);
  if (moves.length === 0) return [null];
  return [...judge.scoreMoves(state, moves)]
    .sort((a, b) => b.gain - a.gain)
    .slice(0, count)
    .map(({ move }) => move);
}

/** Marks every move of `moves` available, then picks: the first never tried, or the best by UCB1. */
function select(node, moves, exploration) {
  const children = moves.map((move) => {
    const key = moveKey(move);
    if (!node.children.has(key)) node.children.set(key, newNode());
    const child = node.children.get(key);
    child.avail += 1;
    return { move, child };
  });
  const fresh = children.find(({ child }) => child.visits === 0);
  if (fresh) return fresh;
  const ucb = ({ child }) => child.wins / child.visits + exploration * Math.sqrt(Math.log(child.avail) / child.visits);
  return children.reduce((best, entry) => (ucb(entry) > ucb(best) ? entry : best));
}

/** One iteration: a deal, a walk down the tree, a rollout, and the result carried back up. */
function iterate(root, ctx) {
  const game = determinize(ctx.state, ctx.player, ctx.deals);
  const path = [];
  let node = root;
  for (let ply = 0; ply < ctx.depth && !game.over; ply += 1) {
    const moves = ply === 0 ? ctx.rootMoves : shortlist(ctx.judge, game, ctx.widen);
    const { move, child } = select(node, moves, ctx.exploration);
    path.push({ child, mover: game.current });
    applyMove(game, move);
    node = child;
    if (child.visits === 0) break;
  }
  const winner = game.over ? game.winner : playOut(game, ctx.rollout);
  for (const { child, mover } of path) {
    child.visits += 1;
    child.wins += pointsFor(winner, mover);
  }
}

/** The search itself, from `state`: every root move with its visits, most visited first. */
export function runIsmcts(state, moves, { base, policy, seed, ...settings }) {
  const { budget, candidates, widen, depth, exploration } = { ...ISMCTS, ...settings };
  const deals = createRng(seed);
  const rootMoves = shortlist(base, state, candidates).filter((move) => moves.some((m) => m.card === move?.card && m.border === move?.border));
  const ctx = { state, player: state.current, deals, rootMoves, judge: policy(createRng(1)), rollout: policy(createRng(deals.int(2 ** 31))), widen, depth, exploration };
  const root = newNode();
  for (let i = 0; i < budget; i += 1) iterate(root, ctx);
  return rootMoves.map((move) => ({ move, visits: root.children.get(moveKey(move))?.visits ?? 0 })).sort((a, b) => b.visits - a.visits);
}

/** The ISMCTS bot: the core shortlists at the root, the rollout policy plays the rest; small endgames are solved. */
export function ismctsBot(rng, { base, policy, name = "ismcts", ...settings }) {
  const seed = rng.int(2 ** 31);
  const scoreMoves = (state, moves, options = {}) => {
    if (moves.length <= 1) return base.scoreMoves(state, moves, options);
    if (exactApplies(state)) return exactScores(state, base.scoreMoves(state, moves, { ...options, keepAll: true }));
    const visits = new Map(runIsmcts(state, moves, { base, policy, seed: seed ^ Math.imul(state.turn + 1, 2654435761), ...settings }).map((entry) => [moveKey(entry.move), entry.visits]));
    return base.scoreMoves(state, moves, options).map((entry) => ({ ...entry, gain: visits.has(moveKey(entry.move)) ? visits.get(moveKey(entry.move)) : -1 + entry.gain / 100 }));
  };
  const bestOf = (scored) => scored.reduce((a, b) => (b.gain > a.gain ? b : a)).move;
  return { name, base, policy, scoreMoves, choose: (state, moves) => (moves.length <= 1 ? moves[0] : bestOf(scoreMoves(state, moves))) };
}

/** The settings an `ismcts` engine id names — `ismcts`, then `+depth=2`, `+widen=6`, `+exploration=1` — or null. */
export function ismctsSettings(name) {
  const [base, ...changes] = name.split("+");
  if (base !== "ismcts") return null;
  return Object.fromEntries(
    changes.map((change) => {
      const [key, value] = change.split("=");
      if (!["depth", "widen", "exploration", "candidates"].includes(key)) throw new Error(`Variante inconnue : « ${key} »`);
      return [key, Number(value)];
    }),
  );
}
