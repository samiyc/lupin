import { legalMoves } from "./game.js";
import { cloneState } from "./lookahead.js";
import { unseenCards } from "./potential.js";

/**
 * Guessing the opponent's hand (`ismcts+infer=N`, Sami, 04/10: a version at
 * 55 % against the V1). A plain search deals the cards it cannot see at random
 * (`determinize`): every hand is as likely, whatever the opponent just played.
 * Here, at the start of a search, N hands are drawn for the opponent and each
 * is weighed by how likely their last move was had they held it — the core's
 * scores turned into odds (a softmax at `temperature`). Every iteration then
 * deals one of those hands, in proportion to its weight, and the pile from the
 * rest.
 *
 * An approximation: the card they drew after that move is counted as already
 * in hand. A move that claimed a border is not read (the board it changed is
 * not rebuilt), nor a first move.
 */
// The core's first and eighth moves lie about 0.4 apart: at 0.2 an opponent who plays its 8th move is a few times less likely, not ruled out (a tree plays the core's favourite one time in ten).
export const INFER = Object.freeze({ temperature: 0.2 });

const hiddenOf = (state, player) => unseenCards(state, player).entries.flatMap(([card, count]) => Array.from({ length: count }, () => card));

/** The board the opponent faced before their last move, had they held `hand` (and the card they played). */
function before({ state, opponent }, { hand, pile }) {
  const last = state.lastMoves[opponent];
  const position = cloneState(state);
  const side = position.borders[last.border].sides[opponent];
  side.splice(side.lastIndexOf(last.card), 1);
  position.hands[opponent] = [...hand, last.card];
  position.current = opponent;
  position.turn = state.turn - 1;
  position.pile = pile;
  return position;
}

/** The odds the core (`judge`) gives the opponent's last move, had they been dealt `deal`. */
function likelihood(reading, deal) {
  const last = reading.state.lastMoves[reading.opponent];
  const position = before(reading, deal);
  const scored = reading.judge.scoreMoves(position, legalMoves(position), { keepAll: true });
  const top = Math.max(...scored.map(({ gain }) => gain));
  const odds = (gain) => Math.exp((gain - top) / INFER.temperature);
  const played = scored.find(({ move }) => move.card === last.card && move.border === last.border);
  return played ? odds(played.gain) / scored.reduce((sum, { gain }) => sum + odds(gain), 0) : 0;
}

/** Was the opponent's last move one this module can read? */
function readable(state, opponent) {
  const last = state.lastMoves[opponent];
  return Boolean(last) && state.borders[last.border].owner === null && state.borders[last.border].sides[opponent].includes(last.card);
}

/**
 * `size` hands for the opponent of `player` (the one to move), each with its
 * cumulative weight (`{ hand, upTo }`, the last `upTo` being 1) — or null when
 * there is nothing to read, or no hand explains the move.
 */
export function inferredHands(state, judge, rng, size) {
  const reading = { state, opponent: 1 - state.current, judge };
  if (!readable(state, reading.opponent)) return null;
  const hidden = hiddenOf(state, state.current);
  const count = state.hands[reading.opponent].length;
  const drawn = Array.from({ length: size }, () => {
    const deal = rng.shuffle([...hidden]);
    const hand = deal.slice(0, count);
    return { hand, weight: likelihood(reading, { hand, pile: deal.slice(count) }) };
  });
  const total = drawn.reduce((sum, { weight }) => sum + weight, 0);
  if (total <= 0 || Number.isNaN(total)) return null;
  let running = 0;
  return drawn.map(({ hand, weight }) => {
    running += weight / total;
    return { hand, upTo: running };
  });
}

/** One of the inferred hands, drawn in proportion to its weight. */
export function pickHand(pool, rng) {
  const at = rng.next();
  return (pool.find(({ upTo }) => at < upTo) ?? pool.at(-1)).hand;
}
