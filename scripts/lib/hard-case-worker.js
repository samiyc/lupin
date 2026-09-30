import { parentPort } from "node:worker_threads";
import { OFFICIAL_RULES } from "../../src/config/rules.js";
import { formatCard } from "../../src/core/notation.js";
import { createRng } from "../../src/core/random.js";
import { playLogged, rulesOf, startLog } from "../../src/replay/log.js";
import { engineFor } from "../../src/sim/bots.js";
import { applyMove, createGame, legalMoves } from "../../src/sim/game.js";
import { cloneState, determinize } from "../../src/sim/lookahead.js";

/**
 * Hard-case hunting (`npm run hard-cases`), one seeded Stratège game per
 * task, under the page's rule. At every `step`-th move the 0.7's search (400
 * rollouts) is run; where it ends without separating its two best moves —
 * within one standard error — the three best are analysed offline: each is
 * played out `playouts` times to the end by `experimental@budget` on both
 * sides, on the same deals. The case is kept when one move leads the next by
 * two standard errors of the paired difference.
 */
const text = (state, move) => `${formatCard(state.spec, move.card)}→${move.border + 1}`;
const pointsFor = (winner, player) => {
  if (winner === null) return 0.5;
  return winner === player ? 1 : 0;
};

/** The 0.7's three best moves when its search cannot tell the first two apart, else null. */
function ambiguousMoves(state) {
  const bot = engineFor("experimental")(createRng(1));
  const moves = legalMoves(state);
  if (moves.length < 3 || bot.solves(state, moves)) return null;
  const search = bot.searchFor(state, moves, {});
  while (!search.done() && search.rollouts() < 400) search.step();
  const rated = search
    .scored()
    .filter((entry) => entry.rating !== undefined)
    .sort((a, b) => b.rating - a.rating);
  if (rated.length < 3) return null;
  const error = Math.sqrt(0.25 / Math.max(1, Math.min(rated[0].rollouts, rated[1].rollouts)));
  return rated[0].rating - rated[1].rating < error ? rated.slice(0, 3).map(({ move }) => move) : null;
}

/** One game from `state` after `move`, both sides played by `engine`. */
function playOutWith(deal, move, engine, seed) {
  const game = cloneState(deal);
  applyMove(game, move);
  const rng = createRng(seed);
  const bots = [engineFor(engine)(rng), engineFor(engine)(rng)];
  while (!game.over) {
    const moves = legalMoves(game);
    applyMove(game, moves.length > 0 ? bots[game.current].choose(game, moves) : null);
  }
  return game.winner;
}

/** Each candidate's points over the same `playouts` deals, and the verdict. */
function analyse(state, candidates, { playouts, budget }) {
  const mover = state.current;
  const rng = createRng(4099 * (state.turn + 1));
  const points = candidates.map(() => []);
  for (let p = 0; p < playouts; p += 1) {
    const deal = { ...determinize(state, mover, rng), endMode: state.endMode };
    const seed = rng.int(2 ** 31);
    candidates.forEach((move, i) => points[i].push(pointsFor(playOutWith(deal, move, `experimental@${budget}`, seed), mover)));
  }
  const means = points.map((list) => list.reduce((a, b) => a + b, 0) / list.length);
  const order = means.map((_, i) => i).sort((a, b) => means[b] - means[a]);
  const diffs = points[order[0]].map((value, p) => value - points[order[1]][p]);
  const mean = diffs.reduce((a, b) => a + b, 0) / diffs.length;
  const error = Math.sqrt(diffs.reduce((sum, d) => sum + (d - mean) ** 2, 0) / (diffs.length - 1) / diffs.length);
  return { means, best: order[0], margin: mean, error, clear: mean >= 2 * error && mean > 0 };
}

/** The hard case `state` makes, if the 0.7 hesitates there and the offline look settles it; else null. */
function caseAt(state, depth) {
  const candidates = ambiguousMoves(state);
  const verdict = candidates && analyse(state, candidates, depth);
  if (!verdict?.clear) return null;
  const { means, best, margin, error } = verdict;
  return { turn: state.turn + 1, candidates: candidates.map((move) => text(state, move)), means, reference: text(state, candidates[best]), margin, error };
}

function huntGame({ seed, step, playouts, budget, until, perGame }) {
  const rng = createRng(seed);
  const bots = [engineFor("strategist")(rng), engineFor("strategist")(rng)];
  const { spec, order, jokerRule, endMode } = rulesOf(OFFICIAL_RULES);
  const state = createGame(spec, { order, jokerRule, endMode, rng });
  const log = startLog(state, { rules: OFFICIAL_RULES, players: [], seed, startedAt: "" });
  const found = [];
  while (!state.over && found.length < perGame && Date.now() < until) {
    const hardCase = state.turn % step === step - 1 ? caseAt(state, { playouts, budget }) : null;
    if (hardCase) found.push({ ...hardCase, seed, log: JSON.parse(JSON.stringify(log)) });
    const moves = legalMoves(state);
    playLogged(log, state, moves.length > 0 ? bots[state.current].choose(state, moves) : null);
  }
  return found;
}

parentPort.on("message", (task) => parentPort.postMessage(Date.now() < task.until ? huntGame(task) : []));
