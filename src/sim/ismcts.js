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
 *
 * With `value` (a first turn) and a `judgeValue(state, player)` (value.js), a
 * leaf reached between that turn and `VALUE_UNTIL` is judged by the learned
 * value instead of being played out: there it predicts as well as eight
 * rollouts, for the cost of one scoring. Later, rollouts are far better.
 */
/** The last turn the learned value judges: past it, one rollout predicts better (npm run value). */
export const VALUE_UNTIL = 29;
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

/** `player` → their points at the end of an iteration: the game's result, a rollout's, or the learned value. */
function leafPoints(game, ctx) {
  if (!game.over && ctx.judgeValue && game.turn >= ctx.value && game.turn <= VALUE_UNTIL) {
    const mine = ctx.judgeValue(game, game.current);
    const me = game.current;
    return (player) => (player === me ? mine : 1 - mine);
  }
  const winner = game.over ? game.winner : playOut(game, ctx.rollout);
  return (player) => pointsFor(winner, player);
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
  const pointsOf = leafPoints(game, ctx);
  for (const { child, mover } of path) {
    child.visits += 1;
    child.wins += pointsOf(mover);
  }
}

/**
 * A search from `state`, advanced one iteration at a time by `step()` — the
 * same interface as `createSearch` (search.js), so the page's worker runs it
 * against its clock. `scored`: the core's `scoreMoves` output; the root
 * shortlist is its `candidates` best. A root move's gain is its visits.
 */
export function createIsmcts(state, scored, { policy, seed, judgeValue = null, ...settings }) {
  const { candidates, widen, depth, exploration, value } = { ...ISMCTS, ...settings };
  const deals = createRng(seed);
  const rootMoves = [...scored]
    .sort((a, b) => b.gain - a.gain)
    .slice(0, candidates)
    .map(({ move }) => move);
  const ctx = { state, player: state.current, deals, rootMoves, judge: policy(createRng(1)), rollout: policy(createRng(deals.int(2 ** 31))), widen, depth, exploration, value, judgeValue };
  const root = newNode();
  let iterations = 0;
  const visits = (move) => root.children.get(moveKey(move))?.visits ?? 0;
  const rated = () => scored.map((entry) => ({ ...entry, gain: rootMoves.includes(entry.move) ? visits(entry.move) : -1 + entry.gain / 100 }));
  return {
    step() {
      iterate(root, ctx);
      iterations += 1;
    },
    done: () => rootMoves.length <= 1,
    rollouts: () => iterations,
    scored: rated,
    best: () => rated().reduce((a, b) => (b.gain > a.gain ? b : a)).move,
  };
}

/** The ISMCTS bot: the core shortlists at the root, the rollout policy plays the rest; small endgames are solved. */
export function ismctsBot(rng, { base, policy, name = "ismcts", budget = ISMCTS.budget, budgetMs = Infinity, ...settings }) {
  const seed = rng.int(2 ** 31);
  const searchFor = (state, moves, options, extra = {}) =>
    createIsmcts(state, base.scoreMoves(state, moves, options), { policy, seed: seed ^ Math.imul(state.turn + 1, 2654435761), ...settings, ...extra });
  // `budgetMs`: a clock instead of a count, to compare variants of unequal speed at equal time.
  const run = (search) => {
    const until = performance.now() + budgetMs;
    while (!search.done() && search.rollouts() < budget && performance.now() < until) search.step();
    return search;
  };
  const solves = (state, moves) => moves.length > 1 && exactApplies(state);
  const bestOf = (scored) => scored.reduce((a, b) => (b.gain > a.gain ? b : a)).move;
  const scoreMoves = (state, moves, options = {}) => {
    if (moves.length <= 1) return base.scoreMoves(state, moves, options);
    if (solves(state, moves)) return exactScores(state, base.scoreMoves(state, moves, { ...options, keepAll: true }));
    return run(searchFor(state, moves, options)).scored();
  };
  return { name, base, policy, searchFor, solves, scoreMoves, choose: (state, moves) => (moves.length <= 1 ? moves[0] : bestOf(scoreMoves(state, moves))) };
}

/**
 * The settings an `ismcts` engine id names — `ismcts`, then `+depth=2`,
 * `+widen=6`, `+exploration=1`, `+sample=0.05` (sampled rollouts), `+value=15`
 * (the learned value judges leaves from turn 15), `+core=1` (the tuned core) — or null.
 */
export function ismctsSettings(name) {
  const [base, ...changes] = name.split("+");
  if (base !== "ismcts") return null;
  return Object.fromEntries(
    changes.map((change) => {
      const [key, value] = change.split("=");
      if (!["depth", "widen", "exploration", "candidates", "sample", "value", "core"].includes(key)) throw new Error(`Variante inconnue : « ${key} »`);
      return [key, Number(value)];
    }),
  );
}
