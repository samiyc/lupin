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
export function withEndUrgency(state, moves, gainOf, { costOf, on }) {
  if (!on || state.pile.length > 0) return gainOf;

  const player = state.current;
  const opp = 1 - player;

  // Pre-calculate 2-card borders for player
  const myTwoCardBorders = state.borders
    .map((border, index) => ({ index, count: border.sides[player].length, oppCount: border.sides[opp].length, owner: border.owner }))
    .filter((entry) => entry.owner === null && entry.count === 2);

  const wonBy = (idx, p) => idx >= 0 && idx < state.borders.length && state.borders[idx].owner === p;

  return (move) => {
    const baseGain = gainOf(move);
    const border = state.borders[move.border];
    const mySide = border.sides[player];
    const oppSide = border.sides[opp];

    // 1. Refund fixed card cost (cards should be spent freely pioche vide)
    let bonus = costOf(move.card);

    // 2. Prioritize finishing 2-card borders vs scattering
    if (myTwoCardBorders.length === 1) {
      if (mySide.length === 2) bonus += 0.5;
      else bonus -= 0.3;
    } else if (myTwoCardBorders.length > 1 && mySide.length === 2) {
      bonus += 0.3;
      if (oppSide.length === 3) bonus += 0.4;
      else if (oppSide.length === 2) bonus += 0.2;
    }

    // 3. Three-adjacent win and block urgency
    if (mySide.length === 2) {
      const b = move.border;
      // Win threat (our 3-in-a-row)
      if ((wonBy(b - 1, player) && wonBy(b - 2, player)) ||
          (wonBy(b + 1, player) && wonBy(b + 2, player)) ||
          (wonBy(b - 1, player) && wonBy(b + 1, player))) {
        bonus += 0.6;
      }
      // Critical block (opponent 3-in-a-row)
      if ((wonBy(b - 1, opp) && wonBy(b - 2, opp)) ||
          (wonBy(b + 1, opp) && wonBy(b + 2, opp)) ||
          (wonBy(b - 1, opp) && wonBy(b + 1, opp))) {
        bonus += 0.5;
      }
    }

    return baseGain + bonus;
  };
}
