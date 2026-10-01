import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DECKS, JOKER_RULES } from "../src/config/decks.js";
import { ORDERS } from "../src/config/formations.js";
import { createRng } from "../src/core/random.js";
import { BOTS, engineFor, pickSampled } from "../src/sim/bots.js";
import { applyMove, createGame, legalMoves } from "../src/sim/game.js";
import { createIsmcts } from "../src/sim/ismcts.js";
import { EXPERIMENT } from "../src/sim/experimental.js";
import { rolloutPolicyOf, strategistBot } from "../src/sim/bots.js";

const spec = DECKS.classique;
const rules = { order: ORDERS.original, jokerRule: JOKER_RULES.colorless };

/** A position `moves` moves into a seeded game between two strategists. */
function position(seed, moves) {
  const rng = createRng(seed);
  const bots = [BOTS.strategist(rng), BOTS.strategist(rng)];
  const state = createGame(spec, { ...rules, rng, endMode: "claim-end" });
  while (!state.over && state.turn < moves) applyMove(state, bots[state.current].choose(state, legalMoves(state)));
  return state;
}

describe("sampled rollouts", () => {
  it("draw the favourite almost always when cold, and spread out when warm", () => {
    const scored = [{ move: "a", gain: 0.5 }, { move: "b", gain: 0.4 }, { move: "c", gain: 0 }];
    const count = (temperature) => {
      const rng = createRng(3);
      return Array.from({ length: 2000 }, () => pickSampled(scored, rng, temperature)).filter((move) => move === "a").length;
    };
    assert.ok(count(0.01) > 1990);
    assert.ok(count(0.2) < 1600 && count(0.2) > 800);
  });
});

describe("ISMCTS", () => {
  it("spends its budget on the core's shortlist and names a legal move", () => {
    const state = position(4, 9);
    const moves = legalMoves(state);
    const base = strategistBot(createRng(1), EXPERIMENT);
    const search = createIsmcts(state, base.scoreMoves(state, moves), { policy: rolloutPolicyOf(EXPERIMENT), seed: 7 });
    for (let i = 0; i < 60; i += 1) search.step();
    const visits = search.scored().filter((entry) => entry.gain >= 0);
    assert.equal(search.rollouts(), 60);
    assert.equal(visits.reduce((sum, entry) => sum + entry.gain, 0), 60, "every iteration visits one root move");
    assert.ok(moves.includes(search.best()));
  });

  it("plays whole games as an engine", () => {
    const rng = createRng(2);
    const bots = [engineFor("ismcts@40")(rng), BOTS.greedy(rng)];
    const state = createGame(spec, { ...rules, rng, endMode: "claim-end" });
    while (!state.over) {
      const moves = legalMoves(state);
      applyMove(state, moves.length ? bots[state.current].choose(state, moves) : null);
    }
    assert.ok(state.over);
  });
});
