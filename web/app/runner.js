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
  return { id, engine: engineOf(id), bot: BOTS[engineOf(id)](createRng(seed)), rng: createRng(seed ^ 0x5bd1e995) };
}

export const botEntry = (seat, id) => ({ seat, kind: "bot", bot: id, version: BOT_LINEUP[id].version, label: BOT_LINEUP[id].label });

export const humanEntry = (seat, name) => ({ seat, kind: "human", name });

/** What the bot would play in `state` (null: it must pass), with its scored candidates. */
export function botChoice(state, player) {
  const moves = legalMoves(state);
  if (moves.length === 0) return { move: null, scored: null };
  const scored = player.bot.scoreMoves(state, moves);
  return { move: pickBest(scored, player.rng), scored };
}

/** Plays the bot's turn in `state`, logged with its best candidates. */
export function playBot(log, state, player) {
  const { move, scored } = botChoice(state, player);
  return playLogged(log, state, move, scored);
}

const yieldToPage = () => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * A whole bot-against-bot game, resolved as a finished log. It hands the page
 * back between moves: a Stratège looking ahead thinks for a fraction of a
 * second per move, and a whole game in one go would freeze the page.
 * `onTurn(turn)` reports progress.
 */
export async function generateBotGame(bottomId, topId, seed, onTurn = () => {}) {
  const state = newGame(seed);
  const players = [botPlayer(bottomId, seed + 1), botPlayer(topId, seed + 2)];
  const log = startLog(state, { rules: RULES, players: [botEntry(0, bottomId), botEntry(1, topId)], seed });
  while (!state.over) {
    playBot(log, state, players[state.current]);
    onTurn(state.turn);
    await yieldToPage();
  }
  return finishLog(log, state);
}

/** "Stratège 1.1.0", or the human's name, for a log's player entry. */
export function playerName(entry) {
  if (!entry) return "";
  return entry.kind === "human" ? entry.name : `${entry.label ?? entry.bot} ${entry.version}`;
}

export { botTag };
