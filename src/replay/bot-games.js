import { createRng } from "../core/random.js";
import { engineFor } from "../sim/bots.js";
import { createGame, legalMoves } from "../sim/game.js";
import { gameRules } from "../sim/simulate.js";
import { analyseGame } from "./game-analysis.js";
import { finishLog, playLogged, startLog } from "./log.js";

/**
 * Duels between bots, kept as replays (`npm run duel -- … --save`, and every
 * long or full-strength duel), so later tests can start from them instead of
 * replaying whole games (Sami, after merlin-is-dead).
 *
 * Each game is an ordinary replay log — deck, every move — plus `analysis`
 * (`game-analysis.js`): starting hands, turning points, who holds the game
 * at turn 30.
 *
 * Each game builds its own bots from its own seed (`log.seed`, and the seat:
 * `seatRng`), so that `branch.js` can build them again and replay any game
 * from any turn — same deck, same pile, same bots.
 */

/** The random stream a seat's bot is built from, in game `log.seed`. */
export const seatRng = (seed, seat) => createRng((Math.imul(seed, 2) + seat + 1) >>> 0);

/** One game between `players` (engine ids), logged, with its analysis. */
function recordedGame(spec, rules, { players, seats, seed }) {
  const bots = players.map((id, seat) => engineFor(id)(seatRng(seed, seat)));
  const state = createGame(spec, { ...rules, rng: createRng(seed) });
  const log = startLog(state, { rules: rules.ids, players: seats, seed });
  while (!state.over) {
    const moves = legalMoves(state);
    playLogged(log, state, moves.length > 0 ? bots[state.current].choose(state, moves) : null);
  }
  finishLog(log, state);
  log.analysis = analyseGame(log);
  return log;
}

/**
 * `playBatch` (`simulate.js`) for duels to keep: the same decks, but every
 * game logged, with bots of its own. `labels`: how each seat is named in the
 * logs (a line-up tag such as "experimental@0.9.0", or the engine id); `ids`:
 * the rules as ids (deck, jokerRule, order). Returns `{ wins, winners, logs }`.
 */
export function playRecordedBatch(spec, { games, seed, players, labels, ids, ...options }) {
  const seats = players.map((engine, seat) => ({ seat, kind: "bot", bot: engine, version: labels?.[seat] ?? engine }));
  const result = { wins: [0, 0], draws: 0, winners: [], logs: [] };
  for (let g = 0; g < games; g += 1) {
    const rules = gameRules(spec, options, g);
    const log = recordedGame(spec, { ...rules, ids: { ...ids, endMode: rules.endMode } }, { players, seats, seed: seed + g });
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
