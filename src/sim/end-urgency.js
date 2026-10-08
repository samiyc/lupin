/**
 * `endUrgency` (core 1.2, Sami 08/10, from the endgame traps): once the pile is
 * empty, tactical urgency dominates over raw local formation scores.
 *
 * 1. Card cost is refunded: all remaining cards will be played anyway, so
 *    penalizing high cards in the endgame is counter-productive.
 * 2. Border completion priority: if only one border has 2 cards, finish it
 *    rather than scattering cards to incomplete (0- or 1-card) borders.
 * 3. Tactical arbitration when multiple 2-card borders exist: prioritize
 *    contested borders (opponent at 2 or 3 cards), and 3-adjacent win/block threats.
 */

function completionBonus(twoCardCount, sideLength, oppSideLength) {
  if (twoCardCount === 1) return sideLength === 2 ? 0.5 : -0.3;
  if (twoCardCount > 1 && sideLength === 2) {
    if (oppSideLength === 3) return 0.7;
    if (oppSideLength === 2) return 0.5;
    return 0.3;
  }
  return 0;
}

function hasPair(borders, owner, a, b) {
  return borders[a]?.owner === owner && borders[b]?.owner === owner;
}

function threeInRow(borders, owner, b) {
  return hasPair(borders, owner, b - 2, b - 1) || hasPair(borders, owner, b + 1, b + 2) || hasPair(borders, owner, b - 1, b + 1);
}

function adjacencyBonus(borders, b, player, opp) {
  let bonus = 0;
  if (threeInRow(borders, player, b)) bonus += 0.6;
  if (threeInRow(borders, opp, b)) bonus += 0.5;
  return bonus;
}

export function withEndUrgency(state, moves, gainOf, { costOf, on }) {
  if (!on || state.pile.length > 0) return gainOf;

  const player = state.current;
  const opp = 1 - player;
  const twoCards = state.borders.filter((b) => b.owner === null && b.sides[player].length === 2).length;

  return (move) => {
    const mySide = state.borders[move.border].sides[player];
    const oppSide = state.borders[move.border].sides[opp];
    let bonus = costOf(move.card) + completionBonus(twoCards, mySide.length, oppSide.length);
    if (mySide.length === 2) bonus += adjacencyBonus(state.borders, move.border, player, opp);
    return gainOf(move) + bonus;
  };
}
