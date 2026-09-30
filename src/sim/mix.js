/**
 * A mixture of experts by phase of the game (engine \`mix:A,B,C\`): the opening
 * (moves 1-14), the middle (15-29) and the end (30 on) each played by their
 * own engine, any engine id with its variants. The phase is read from the
 * move number alone, so each expert only computes what its own phase asks.
 */
export const PHASE_ENDS = Object.freeze([14, 29]);

/** Which of the three experts plays move \`turn\` (1-based). */
export function phaseOf(turn, ends = PHASE_ENDS) {
  if (turn <= ends[0]) return 0;
  return turn <= ends[1] ? 1 : 2;
}

/** \`experts\`: three bots, already built. */
export function mixBot(experts, ends = PHASE_ENDS) {
  const expertFor = (state) => experts[phaseOf(state.turn + 1, ends)];
  return {
    name: "mix",
    scoreMoves: (state, moves, options) => expertFor(state).scoreMoves(state, moves, options),
    choose: (state, moves) => expertFor(state).choose(state, moves),
  };
}
