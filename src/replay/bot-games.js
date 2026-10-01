import { createRng } from "../core/random.js";
import { engineFor } from "../sim/bots.js";
import { solveEndgame } from "../sim/endgame.js";
import { EXACT } from "../sim/exact.js";
import { createGame, legalMoves } from "../sim/game.js";
import { handClass, startingHands } from "../sim/hand-classes.js";
import { gameRules } from "../sim/simulate.js";
import { finishLog, playLogged, startLog, stateAt } from "./log.js";

/**
 * Duels between bots, kept as replays (`npm run duel -- … --save`, and every
 * long or 800-iteration duel), so later tests can start from them instead of
 * replaying whole games (Sami, after merlin-is-dead).
 *
 * Each game is an ordinary replay log — deck, every move — plus `analysis`:
 * - `handClasses`: each seat's starting hand, weak, medium or strong
 *   (`hand-classes.js`), to keep only balanced games;
 * - `advantage`: who holds the game at the turning point, once the pile is
 *   empty (after `TURNING_TURN` moves), by exact play — computed once here so
 *   no later test pays the solver again.
 *
 * Replaying from a turn is `stateAt(log, turn)` (`log.js`): same deck, same
 * pile, one mechanism changed on one move, and the rest played again.
 */
export const TURNING_TURN = 30;

/** The winner under perfect play from the value `value` of the player `toMove`: a seat, or null for a draw. */
const perfectWinner = (value, toMove) => {
  if (value === 0) return null;
  return value === 1 ? toMove : 1 - toMove;
};

/**
 * Who holds the game after `turn` moves. The pile is empty then, nothing is
 * hidden, and the solver says it (`EXACT.nodes` at most): `{ turn, toMove,
 * value, winner }` — value 1, 0 or -1 for the player to move. A game over
 * before that turn reports its result (`ended: true`); a solve that runs out
 * of positions reports `value: null`.
 */
export function advantageAt(log, turn = TURNING_TURN) {
  if (log.turns.length <= turn) return { turn, ended: true, winner: log.result.winner };
  const state = stateAt(log, turn + 1);
  if (state.over || state.pile.length > 0) return { turn, ended: state.over, winner: state.winner };
  const solution = solveEndgame(state, { stopAtWin: true, maxNodes: EXACT.nodes });
  if (!solution.complete) return { turn, toMove: state.current, value: null };
  return { turn, toMove: state.current, value: solution.value, winner: perfectWinner(solution.value, state.current) };
}

/** One game between `bots`, logged, with its analysis. */
function recordedGame(spec, rules, { bots, rng, players, seed }) {
  const state = createGame(spec, { ...rules, rng });
  const log = startLog(state, { rules: rules.ids, players, seed });
  while (!state.over) {
    const moves = legalMoves(state);
    playLogged(log, state, moves.length > 0 ? bots[state.current].choose(state, moves) : null);
  }
  finishLog(log, state);
  log.analysis = { handClasses: startingHands(spec, state.deck).map((hand) => handClass(spec, hand)), advantage: advantageAt(log) };
  return log;
}

/**
 * `playBatch` (`simulate.js`) for duels to keep: the same decks, the same
 * bots, but every game logged. `labels`: how each seat is named in the logs
 * (a line-up tag such as "experimental@0.9.0", or the engine id); `ids`: the
 * rules as ids (deck, jokerRule, order). Returns `{ wins, winners, logs }`.
 */
export function playRecordedBatch(spec, { games, seed, players, labels, ids, ...options }) {
  const rng = createRng(seed);
  const bots = players.map((id) => engineFor(id)(rng));
  const seats = players.map((engine, seat) => ({ seat, kind: "bot", bot: engine, version: labels?.[seat] ?? engine }));
  const result = { wins: [0, 0], draws: 0, winners: [], logs: [] };
  for (let g = 0; g < games; g += 1) {
    const rules = gameRules(spec, options, g);
    const log = recordedGame(spec, { ...rules, ids: { ...ids, endMode: rules.endMode } }, { bots, rng, players: seats, seed: seed + g });
    const { winner } = log.result;
    if (winner === null) result.draws += 1;
    else result.wins[winner] += 1;
    result.winners.push(winner);
    result.logs.push(log);
  }
  return result;
}

/** The games whose two starting hands are both medium: a middle game balanced enough to compare one change. */
export const balancedGames = (logs) => logs.filter((log) => log.analysis?.handClasses.every((kind) => kind === "medium"));
