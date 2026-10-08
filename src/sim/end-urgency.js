import { isJoker } from "../core/cards.js";
import { evaluatorFor } from "./border-rules.js";

/**
 * `endUrgency` (core 1.2, Sami 08/10, from the endgame traps): once the pile is
 * empty, tactical urgency dominates over raw local formation scores.
 *
 * 1. Card cost is refunded: all remaining cards will be played anyway, so
 *    penalizing high cards in the endgame is counter-productive.
 * 2. Border completion priority: if a 2-card border wins against the opponent,
 *    finish it rather than scattering. If completing it loses, heavily penalize.
 * 3. Tactical arbitration when multiple 2-card borders exist: prioritize
 *    contested borders and 3-adjacent win/block threats.
 * 4. Joker discipline: don't dump jokers onto empty borders when threats exist.
 */

function sideCompletionBonus(state, move, ctx) {
  const border = state.borders[move.border];
  const oppSide = border.sides[ctx.opp];
  const mySide = [...border.sides[ctx.player], move.card];
  const myScore = evaluatorFor(state, move.border, ctx.player).score(mySide);

  if (oppSide.length === 3) {
    const oppScore = evaluatorFor(state, move.border, ctx.opp).score(oppSide);
    return myScore > oppScore ? 1.2 : -2.0;
  }
  if (oppSide.length === 2) {
    return myScore >= 2000 ? 0.9 : 0.5;
  }
  return ctx.twoCards === 1 ? 0.5 : 0.3;
}

function hasPair(borders, owner, a, b) {
  return borders[a]?.owner === owner && borders[b]?.owner === owner;
}

function threeInRow(borders, owner, b) {
  return hasPair(borders, owner, b - 2, b - 1) || hasPair(borders, owner, b + 1, b + 2) || hasPair(borders, owner, b - 1, b + 1);
}

function adjacencyBonus(borders, b, player, opp) {
  let bonus = 0;
  if (threeInRow(borders, player, b)) bonus += 0.7;
  if (threeInRow(borders, opp, b)) bonus += 0.6;
  return bonus;
}

function moveUrgencyBonus(state, move, ctx) {
  const mySide = state.borders[move.border].sides[ctx.player];
  const oppSide = state.borders[move.border].sides[ctx.opp];

  if (mySide.length === 2) {
    return sideCompletionBonus(state, move, ctx) + adjacencyBonus(state.borders, move.border, ctx.player, ctx.opp);
  }
  if (ctx.twoCards === 1) return -0.4;
  if (ctx.twoCards === 0 && oppSide.length === 2 && mySide.length === 0) return 0.3;
  return 0;
}

function jokerPenalty(state, move, opp) {
  if (!isJoker(move.card)) return 0;
  const oppSide = state.borders[move.border].sides[opp];
  if (oppSide.length === 0 && state.borders.some((b) => b.owner === null && b.sides[opp].length >= 2)) {
    return -0.6;
  }
  return 0;
}

export function withEndUrgency(state, moves, gainOf, { costOf, on }) {
  if (!on || state.pile.length > 0) return gainOf;

  const player = state.current;
  const opp = 1 - player;
  const twoCards = state.borders.filter((b) => b.owner === null && b.sides[player].length === 2).length;
  const ctx = { player, opp, twoCards };

  return (move) => {
    const bonus = costOf(move.card) + moveUrgencyBonus(state, move, ctx) + jokerPenalty(state, move, opp);
    return gainOf(move) + bonus;
  };
}
