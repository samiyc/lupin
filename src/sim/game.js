import { buildDeck, isJoker } from "../core/cards.js";
import { getEvaluator } from "../core/evaluator.js";

/**
 * The rules of a match, and nothing about how to play it.
 *
 * Simplification, stated in the report: a border is resolved once both sides
 * hold three cards. The real game also lets a player claim a border earlier by
 * proving the opponent cannot beat it; modelling proofs would not change which
 * formations get built, only when a border is settled.
 */
export function createGame(spec, { order, jokerRule, rng }) {
  const pile = rng.shuffle(buildDeck(spec));
  const borders = Array.from({ length: spec.borders }, () => ({
    sides: [[], []],
    completedAt: [Infinity, Infinity],
    owner: null,
  }));
  return {
    spec,
    order,
    jokerRule,
    evaluator: getEvaluator(spec, order, jokerRule),
    pile,
    hands: [pile.splice(0, spec.handSize), pile.splice(0, spec.handSize)],
    borders,
    jokersPlayed: [0, 0],
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
  if (border.owner !== null || side.length >= 3) return false;
  if (!isJoker(card)) return true;
  return (
    jokersOn(side) < state.jokerRule.maxPerSide &&
    state.jokersPlayed[player] < state.jokerRule.maxPerPlayer
  );
}

/** One move per distinct card and open border: two jokers are one choice. */
export function legalMoves(state) {
  const player = state.current;
  const moves = [];
  for (const card of new Set(state.hands[player])) {
    state.borders.forEach((_, border) => {
      if (canPlace(state, player, card, border)) moves.push({ card, border });
    });
  }
  return moves;
}

/** Plays `move`, or passes when it is null (no legal move left). */
export function applyMove(state, move) {
  const player = state.current;
  if (move === null) {
    state.passes += 1;
    if (state.passes >= 2) endOnExhaustion(state);
  } else {
    placeCard(state, player, move);
    state.passes = 0;
  }
  state.turn += 1;
  state.current = 1 - player;
}

function placeCard(state, player, { card, border }) {
  const hand = state.hands[player];
  hand.splice(hand.indexOf(card), 1);
  const target = state.borders[border];
  target.sides[player].push(card);
  if (isJoker(card)) state.jokersPlayed[player] += 1;
  if (target.sides[player].length === 3) target.completedAt[player] = state.turn;
  if (state.pile.length > 0) hand.push(state.pile.pop());
  if (target.sides.every((side) => side.length === 3)) resolveBorder(state, border);
}

function resolveBorder(state, index) {
  const border = state.borders[index];
  const scores = border.sides.map((side) => state.evaluator.score(side));
  const formations = border.sides.map((side) => state.evaluator.formation(side));
  const winner = pickWinner(scores, border.completedAt);
  border.owner = winner;
  state.resolved.push({ border: index, winner, formations, decidedBy: decidedBy(state, border, formations) });
  checkVictory(state, winner);
}

function pickWinner(scores, completedAt) {
  if (scores[0] !== scores[1]) return scores[0] > scores[1] ? 0 : 1;
  return completedAt[0] < completedAt[1] ? 0 : 1;
}

function decidedBy(state, border, formations) {
  if (formations[0] !== formations[1]) return "formation";
  const sums = border.sides.map((side) => state.evaluator.sum(side));
  return sums[0] === sums[1] ? "first" : "sum";
}

function checkVictory(state, player) {
  const owned = state.borders.map((border) => border.owner === player);
  if (longestRun(owned) >= state.spec.adjacent) return finish(state, player, "adjacent");
  if (owned.filter(Boolean).length >= state.spec.majority) finish(state, player, "majority");
  return state;
}

function longestRun(flags) {
  let best = 0;
  let run = 0;
  for (const flag of flags) {
    run = flag ? run + 1 : 0;
    best = Math.max(best, run);
  }
  return best;
}

function finish(state, winner, winType) {
  state.winner = winner;
  state.winType = winType;
  state.over = true;
  return state;
}

/** Nobody can play: more borders wins, equal is a draw. */
function endOnExhaustion(state) {
  const count = (player) => state.borders.filter((b) => b.owner === player).length;
  const [zero, one] = [count(0), count(1)];
  if (zero === one) return finish(state, null, "draw");
  return finish(state, zero > one ? 0 : 1, "exhaustion");
}

/** Runs a match to its end; `bots[p].choose(state, moves)` picks a move. */
export function playGame(spec, { order, jokerRule, rng, bots }) {
  const state = createGame(spec, { order, jokerRule, rng });
  const guard = spec.borders * 6 * 3;
  while (!state.over && state.turn < guard) {
    const moves = legalMoves(state);
    applyMove(state, moves.length > 0 ? bots[state.current].choose(state, moves) : null);
  }
  return state;
}
