import { BOT_LINEUP, botTag, engineOf } from "../../src/config/bots.js";
import { OFFICIAL_RULES } from "../../src/config/rules.js";
import { createRng } from "../../src/core/random.js";
import { finishLog, playLogged, rulesOf, startLog } from "../../src/replay/log.js";
import { BOTS, pickBest } from "../../src/sim/bots.js";
import { createGame, legalMoves } from "../../src/sim/game.js";

/**
 * Games as the page plays them: the official rules, borders settled at the
 * end, every move logged. The same functions drive a human game and generate
 * an observer game, so both read the same way in the replay viewer.
 */
export const RULES = OFFICIAL_RULES;
export const SPEC = rulesOf(RULES).spec;

export function newGame(seed) {
  const { spec, order, jokerRule, endMode } = rulesOf(RULES);
  return createGame(spec, { order, jokerRule, endMode, rng: createRng(seed) });
}

export function botPlayer(id, seed) {
  return { id, bot: BOTS[engineOf(id)](createRng(seed)), rng: createRng(seed ^ 0x5bd1e995) };
}

export const botEntry = (seat, id) => ({ seat, kind: "bot", bot: id, version: BOT_LINEUP[id].version, label: BOT_LINEUP[id].label });

export const humanEntry = (seat, name) => ({ seat, kind: "human", name });

/** Plays the bot's turn in `state`, logged with its best candidates. */
export function playBot(log, state, player) {
  const moves = legalMoves(state);
  if (moves.length === 0) return playLogged(log, state, null);
  const scored = player.bot.scoreMoves(state, moves);
  return playLogged(log, state, pickBest(scored, player.rng), scored);
}

/** A whole bot-against-bot game, returned as a finished log. */
export function generateBotGame(bottomId, topId, seed) {
  const state = newGame(seed);
  const players = [botPlayer(bottomId, seed + 1), botPlayer(topId, seed + 2)];
  const log = startLog(state, { rules: RULES, players: [botEntry(0, bottomId), botEntry(1, topId)], seed });
  while (!state.over) playBot(log, state, players[state.current]);
  return finishLog(log, state);
}

/** "Stratège 1.0.0", or the human's name, for a log's player entry. */
export function playerName(entry) {
  if (!entry) return "";
  return entry.kind === "human" ? entry.name : `${entry.label ?? entry.bot} ${entry.version}`;
}

export { botTag };
