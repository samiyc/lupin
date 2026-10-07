import { buildDeck, isJoker } from "../core/cards.js";
import { isFigure } from "../core/figures.js";
import { getEvaluator } from "../core/evaluator.js";
import { figureMoves, playFigure } from "./figure-moves.js";
import { checkVictory, claimBorders, decideByCount, isFull, resolveBorder, resolveFinal } from "./settle.js";

export { resolveFinal };

/**
 * The rules of a match, and nothing about how to play it.
 *
 * Two ways to settle borders, same winner:
 *
 * - `endMode: "early"` (the simulations): a border is resolved as soon as both
 *   sides hold three cards, and the game stops at the first victory.
 * - `endMode: "final"` (the web game): all 42 cards are played, then the
 *   borders are resolved in the order they filled up, and the first player to
 *   reach a victory in that order wins. Bots never look at who owns a border,
 *   and a resolved border is full anyway, so both modes pick the same winner;
 *   a test holds them to it.
 *
 * - `endMode: "claim-end"` (the web game, the printed rule): right after a
 *   move, the player who made it claims every border they can prove the
 *   opponent can no longer beat, from the cards on the table alone
 *   (`isClaimable`), then the opponent claims theirs — a card laid down can
 *   prove a border for either side. A claimed border takes no more cards, and
 *   the game stops at the first victory, the mover's first. Borders never
 *   claimed settle at the end, as in `final`. It changes which moves are
 *   legal, so it can change the winner.
 * - `endMode: "claim"`: the same, but claimed at the start of the claimer's
 *   next turn — the web game of 30/09, a move late. Kept so its replays read
 *   back as they were played.
 */
export function createGame(spec, { order, jokerRule, rng, endMode = "early", deck = null, figures = [] }) {
  // The extension's figures (docs/extension.md) join the pile; without them, the base game's draw exactly.
  const cards = figures.length > 0 ? [...buildDeck(spec), ...figures] : buildDeck(spec);
  const shuffled = deck ? [...deck] : rng.shuffle(cards);
  const pile = [...shuffled];
  const borders = Array.from({ length: spec.borders }, () => ({
    sides: [[], []],
    completedAt: [Infinity, Infinity],
    owner: null,
    // The figure laid beside each side (figures.js), null for none.
    figures: [null, null],
  }));
  return {
    spec,
    order,
    jokerRule,
    endMode,
    deck: shuffled,
    evaluator: getEvaluator(spec, order, jokerRule),
    pile,
    hands: [pile.splice(0, spec.handSize), pile.splice(0, spec.handSize)],
    borders,
    // The extension: figures in this game (the core leaves them out of the hands it weighs).
    withFigures: shuffled.some(isFigure),
    jokersPlayed: [0, 0],
    // Each player's last move, replaced (never mutated), so a cheap clone can share it.
    lastMoves: [null, null],
    current: 0,
    turn: 0,
    passes: 0,
    resolved: [],
    winner: null,
    winType: null,
    over: false,
  };
}

const jokersOn = (side) => side.filter(isJoker).length;

export function canPlace(state, player, card, borderIndex) {
  const border = state.borders[borderIndex];
  const side = border.sides[player];
  if (border.owner !== null || side.length >= 3 || isFigure(card)) return false;
  if (!isJoker(card)) return true;
  return (
    jokersOn(side) < state.jokerRule.maxPerSide &&
    state.jokersPlayed[player] < state.jokerRule.maxPerPlayer
  );
}

/** One move per distinct card and open border: two jokers are one choice. A figure has its own moves (figure-moves.js). */
export function legalMoves(state) {
  const player = state.current;
  const moves = [];
  for (const card of new Set(state.hands[player])) {
    if (isFigure(card)) {
      moves.push(...figureMoves(state, player, card));
      continue;
    }
    state.borders.forEach((_, border) => {
      if (canPlace(state, player, card, border)) moves.push({ card, border });
    });
  }
  return moves;
}

const allPlayed = (state) => state.pile.length === 0 && state.hands.every((hand) => hand.length === 0);

/** Plays `move`, or passes when it is null (no legal move left). */
export function applyMove(state, move) {
  const player = state.current;
  if (move === null) {
    state.passes += 1;
    if (state.passes >= 2) endOnExhaustion(state);
  } else {
    if (isFigure(move.card)) layFigure(state, player, move);
    else placeCard(state, player, move);
    state.passes = 0;
  }
  state.turn += 1;
  state.current = 1 - player;
  if (!state.over && state.endMode !== "early") settleAfter(state, player, move);
}

/** What the end modes settle once a move (or a pass) is made. */
function settleAfter(state, player, move) {
  if (state.endMode === "claim") claimBorders(state, state.current);
  if (state.endMode === "claim-end" && move !== null) claimAfterMove(state, player);
  if (!state.over && allPlayed(state)) resolveFinal(state);
}

/** `claim-end`: the mover claims first, so a double victory is theirs. */
function claimAfterMove(state, player) {
  claimBorders(state, player);
  if (!state.over) claimBorders(state, 1 - player);
}

/** A figure laid: its effect, then the draw — but for the Rappel, which already gave a card back. */
function layFigure(state, player, move) {
  const draws = playFigure(state, player, move);
  if (draws && state.pile.length > 0) state.hands[player].push(state.pile.pop());
}

function placeCard(state, player, { card, border }) {
  const hand = state.hands[player];
  hand.splice(hand.indexOf(card), 1);
  const target = state.borders[border];
  target.sides[player].push(card);
  if (isJoker(card)) state.jokersPlayed[player] += 1;
  state.lastMoves = state.lastMoves.map((last, seat) => (seat === player ? { card, border } : last));
  if (target.sides[player].length === 3) target.completedAt[player] = state.turn;
  if (state.pile.length > 0) hand.push(state.pile.pop());
  if (state.endMode === "early" && isFull(target)) {
    const winner = resolveBorder(state, border);
    checkVictory(state, winner);
  }
}

/** Nobody can play: settle what is left, then more borders wins, equal is a draw. */
function endOnExhaustion(state) {
  if (state.endMode !== "early" && !state.finalResolved) return resolveFinal(state);
  return decideByCount(state);
}

/** Runs a match to its end; `bots[p].choose(state, moves)` picks a move. */
export function playGame(spec, { order, jokerRule, rng, bots, endMode = "early", deck = null }) {
  const state = createGame(spec, { order, jokerRule, rng, endMode, deck });
  const guard = spec.borders * 6 * 3;
  while (!state.over && state.turn < guard) {
    const moves = legalMoves(state);
    applyMove(state, moves.length > 0 ? bots[state.current].choose(state, moves) : null);
  }
  return state;
}
