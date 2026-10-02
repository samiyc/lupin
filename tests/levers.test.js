import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DECKS, JOKER_RULES } from "../src/config/decks.js";
import { ORDERS } from "../src/config/formations.js";
import { createRng } from "../src/core/random.js";
import { BOTS, engineFor, pickSampled } from "../src/sim/bots.js";
import { applyMove, createGame, legalMoves } from "../src/sim/game.js";
import { createIsmcts, isPivot } from "../src/sim/ismcts.js";
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

/** A whole game between engine `id` and the greedy bot, to its end. */
function playsThrough(id) {
  const rng = createRng(2);
  const bots = [engineFor(id)(rng), BOTS.greedy(rng)];
  const state = createGame(spec, { ...rules, rng, endMode: "claim-end" });
  while (!state.over) {
    const moves = legalMoves(state);
    applyMove(state, moves.length ? bots[state.current].choose(state, moves) : null);
  }
  return state;
}

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

  it("plays whole games as an engine, with every way of searching deeper", () => {
    for (const id of ["ismcts@40", "ismcts+pw=1+widen=6+depth=5@40", "ismcts+rave=300@40", "ismcts+exact=12+hope=1@40", "ismcts+widen=3+depth=5+core=nb1@30", "ismcts+shortlist=plain+rollout=nb2@30", "core:plain"]) assert.ok(playsThrough(id).over, id);
  });

  it("marks the move after the opponent has started all seven borders, once", () => {
    const pivots = [];
    const state = position(6, 0);
    const bot = BOTS.strategist(createRng(1));
    while (!state.over && state.pile.length > 0) {
      if (isPivot(state)) pivots.push(state.current);
      applyMove(state, bot.choose(state, legalMoves(state)));
    }
    assert.ok(pivots.length >= 1 && pivots.length <= 2, `${pivots}`);
    assert.equal(new Set(pivots).size, pivots.length, "once for each player at most");
  });

  it("solves the empty pile exactly up to the cards asked", () => {
    const state = position(8, 0);
    const bot = BOTS.strategist(createRng(1));
    while (state.pile.length > 0 && !state.over) applyMove(state, bot.choose(state, legalMoves(state)));
    const moves = legalMoves(state);
    const cards = state.hands[0].length + state.hands[1].length;
    assert.equal(engineFor("ismcts@40")(createRng(1)).solves(state, moves), cards <= 8);
    assert.equal(engineFor("ismcts+exact=12@40")(createRng(1)).solves(state, moves), moves.length > 1);
  });
});
