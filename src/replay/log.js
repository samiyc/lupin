import { DECKS, JOKER_RULES } from "../config/decks.js";
import { ORDERS } from "../config/formations.js";
import { isJoker } from "../core/cards.js";
import { bySuitThenValue, formatCard, formatCards, parseCard, parseCards } from "../core/notation.js";
import { applyMove, createGame, legalMoves } from "../sim/game.js";

/**
 * Replay logs: everything that happened in a game, in plain JSON, cards
 * written "7♥". A log carries the full deck order, so `replayStates` can
 * rebuild the game move by move — and refuses a log whose moves are not legal
 * or whose draws do not match.
 *
 * Borders are numbered 1 to 7 in a log, as players count them; 0-based in
 * the engine.
 */
export const REPLAY_FORMAT = "lopin-replay/1";
const CANDIDATES_KEPT = 5;

/** `rules`: ids, e.g. `{ deck: "classique", jokerRule: "colorless", order: "original", endMode: "final" }`. */
export function rulesOf(rules) {
  return {
    spec: DECKS[rules.deck],
    order: ORDERS[rules.order],
    jokerRule: JOKER_RULES[rules.jokerRule],
    endMode: rules.endMode,
  };
}

export function startLog(state, { rules, players, seed, startedAt = new Date().toISOString() }) {
  return {
    format: REPLAY_FORMAT,
    startedAt,
    endedAt: null,
    rules,
    players,
    seed,
    deck: formatCards(state.spec, state.deck),
    turns: [],
    result: null,
  };
}

function sideContext(state, player, border) {
  const target = state.borders[border];
  const [mine, theirs] = [target.sides[player], target.sides[1 - player]];
  return {
    mine: formatCards(state.spec, mine),
    theirs: formatCards(state.spec, theirs),
    wasEmpty: mine.length === 0,
    completes: mine.length === 2,
    theirsFull: theirs.length === 3,
  };
}

function candidatesOf(spec, scored) {
  if (!scored) return null;
  return [...scored]
    .sort((a, b) => b.gain - a.gain)
    .slice(0, CANDIDATES_KEPT)
    .map(({ move, gain }) => ({ card: formatCard(spec, move.card), border: move.border + 1, gain: Number(gain.toFixed(4)) }));
}

/**
 * Applies `move` (or a pass, `null`) to `state` and appends the turn to `log`.
 * `scored` is the bot's `scoreMoves` output, kept as its best candidates.
 */
export function playLogged(log, state, move, scored = null) {
  const { spec } = state;
  const player = state.current;
  const entry = {
    turn: state.turn + 1,
    player,
    hand: formatCards(spec, [...state.hands[player]].sort(bySuitThenValue(spec))),
    pile: state.pile.length,
  };
  if (move === null) {
    applyMove(state, null);
    log.turns.push({ ...entry, pass: true });
    return entry;
  }
  Object.assign(entry, {
    move: { card: formatCard(spec, move.card), border: move.border + 1 },
    side: sideContext(state, player, move.border),
    joker: isJoker(move.card),
    candidates: candidatesOf(spec, scored),
  });
  const drawing = state.pile.length > 0;
  applyMove(state, move);
  const hand = state.hands[player];
  entry.drew = drawing ? formatCard(spec, hand[hand.length - 1]) : null;
  log.turns.push(entry);
  return entry;
}

export function finishLog(log, state, endedAt = new Date().toISOString()) {
  const { spec } = state;
  log.endedAt = endedAt;
  log.result = {
    winner: state.winner,
    winType: state.winType,
    borders: state.resolved.map((entry) => ({
      border: entry.border + 1,
      sides: state.borders[entry.border].sides.map((side) => formatCards(spec, side)),
      formations: entry.formations,
      sums: entry.sums,
      winner: entry.winner,
      decidedBy: entry.decidedBy,
      filledAt: entry.filledAt + 1,
    })),
  };
  return log;
}

/** What the page draws and the replay stores: a plain copy, no evaluator. */
export function snapshot(state) {
  return {
    turn: state.turn,
    current: state.current,
    pile: state.pile.length,
    hands: state.hands.map((hand) => [...hand]),
    borders: state.borders.map((border) => ({ sides: border.sides.map((side) => [...side]), owner: border.owner })),
    resolved: state.resolved.map((entry) => ({ ...entry })),
    winner: state.winner,
    winType: state.winType,
    over: state.over,
  };
}

function replayTurn(state, entry, index) {
  const fail = (why) => {
    throw new Error(`Replay invalide au tour ${index + 1} : ${why}`);
  };
  if (entry.player !== state.current) fail(`c'était au joueur ${state.current + 1}`);
  if (entry.pass) {
    if (legalMoves(state).length > 0) fail("passe alors qu'un coup était possible");
    applyMove(state, null);
    return;
  }
  const move = { card: parseCard(state.spec, entry.move.card), border: entry.move.border - 1 };
  if (!legalMoves(state).some((m) => m.card === move.card && m.border === move.border)) fail(`coup illégal ${entry.move.card} → ${entry.move.border}`);
  const drawing = state.pile.length > 0;
  applyMove(state, move);
  const hand = state.hands[entry.player];
  if (drawing && formatCard(state.spec, hand[hand.length - 1]) !== entry.drew) fail(`pioche différente (${entry.drew})`);
}

/**
 * Every state of a logged game: `frames[0]` is the deal, `frames[i]` the
 * table after turn `i`, with the turn's log entry attached.
 */
export function replayStates(log) {
  if (log.format !== REPLAY_FORMAT) throw new Error(`Format de replay inconnu : ${log.format}`);
  const { spec, order, jokerRule, endMode } = rulesOf(log.rules);
  const state = createGame(spec, { order, jokerRule, endMode, deck: parseCards(spec, log.deck), rng: null });
  const frames = [{ state: snapshot(state), entry: null }];
  log.turns.forEach((entry, index) => {
    replayTurn(state, entry, index);
    frames.push({ state: snapshot(state), entry });
  });
  return frames;
}
