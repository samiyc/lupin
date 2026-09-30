import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DECKS, JOKER_RULES } from "../src/config/decks.js";
import { ORDERS } from "../src/config/formations.js";
import { createRng } from "../src/core/random.js";
import { BOTS, engineFor, pickSampled } from "../src/sim/bots.js";
import { applyMove, createGame, legalMoves } from "../src/sim/game.js";
import { runIsmcts } from "../src/sim/ismcts.js";
import { likelihood, modelledDeal } from "../src/sim/model.js";
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

describe("the opponent model", () => {
  it("records each player's last move without sharing it between clones", () => {
    const state = position(5, 6);
    assert.ok(state.lastMoves.every((move) => move && Number.isInteger(move.border)));
  });

  it("finds the move actually played plausible when the deal is the truth", () => {
    const judge = rolloutPolicyOf(EXPERIMENT)(createRng(0));
    let plausible = 0;
    for (let seed = 1; seed <= 20; seed += 1) {
      const state = position(seed, 11);
      // The true hands, seen from the opponent's side: the strategist played its favourite.
      if (likelihood(state, 1 - state.current, judge, 0.15) > 0.5) plausible += 1;
    }
    assert.ok(plausible >= 14, `${plausible} / 20`);
  });

  it("deals a full hand to the opponent, like a plain deal", () => {
    const state = position(9, 14);
    const judge = rolloutPolicyOf(EXPERIMENT)(createRng(0));
    const deal = modelledDeal(state, state.current, createRng(1), { judge, temperature: 0.15 });
    assert.equal(deal.hands[1 - state.current].length, state.hands[1 - state.current].length);
    assert.equal(deal.pile.length, state.pile.length);
  });
});

describe("ISMCTS", () => {
  it("spends its budget on the core's shortlist and names a legal move", () => {
    const state = position(4, 9);
    const moves = legalMoves(state);
    const base = strategistBot(createRng(1), EXPERIMENT);
    const ranked = runIsmcts(state, moves, { base, policy: rolloutPolicyOf(EXPERIMENT), seed: 7, budget: 60 });
    assert.equal(ranked.reduce((sum, entry) => sum + entry.visits, 0), 60);
    assert.ok(moves.some((move) => move.card === ranked[0].move.card && move.border === ranked[0].move.border));
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
