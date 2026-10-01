import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DECKS, JOKER_RULES } from "../src/config/decks.js";
import { ORDERS } from "../src/config/formations.js";
import { createRng } from "../src/core/random.js";
import { BOTS, borderOdds, engineFor } from "../src/sim/bots.js";
import { applyMove, createGame, legalMoves } from "../src/sim/game.js";
import { createValue, independentWin } from "../src/sim/value.js";

const spec = DECKS.classique;
const even = Array.from({ length: spec.borders }, () => 0.5);

function midGame(seed, moves = 20) {
  const rng = createRng(seed);
  const bots = [BOTS.greedy(rng), BOTS.greedy(rng)];
  const state = createGame(spec, { order: ORDERS.original, jokerRule: JOKER_RULES.colorless, rng, endMode: "final" });
  while (state.turn < moves) applyMove(state, bots[state.current].choose(state, legalMoves(state)));
  return state;
}

describe("the learned value", () => {
  it("reads the game from the borders: all won, all lost, even", () => {
    assert.equal(independentWin(even.map(() => 1), spec), 1);
    assert.equal(independentWin(even.map(() => 0), spec), 0);
    assert.ok(Math.abs(independentWin(even, spec) - 0.5) < 1e-9, "the board is symmetric");
  });

  it("gives the two players chances that add up to one", () => {
    const value = createValue(borderOdds);
    const state = midGame(4);
    const [mine, theirs] = [value(state, 0), value(state, 1)];
    assert.ok(mine > 0 && mine < 1);
    assert.ok(Math.abs(mine + theirs - 1) < 1e-12);
  });

  it("lets the tree judge leaves with it, and stop on a clock", () => {
    const state = midGame(9, 16);
    for (const id of ["ismcts+value=15@30", "ismcts@t20", "experimental@t20"]) {
      const bot = engineFor(id)(createRng(1));
      const moves = legalMoves(state);
      assert.ok(moves.some((move) => move === bot.choose(state, moves)), id);
    }
  });
});
