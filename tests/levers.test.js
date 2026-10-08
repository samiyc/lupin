import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DECKS, JOKER_RULES } from "../src/config/decks.js";
import { ORDERS } from "../src/config/formations.js";
import { createRng } from "../src/core/random.js";
import { BOTS, engineFor, pickSampled } from "../src/sim/bots.js";
import { applyMove, createGame, legalMoves } from "../src/sim/game.js";
import { createIsmcts, isPivot } from "../src/sim/ismcts.js";
import { pickCandidates } from "../src/sim/pick.js";
import { EXPERIMENT } from "../src/sim/experimental.js";
import { HABITS } from "../src/sim/strategist.js";
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

describe("ideas for the first turns only", () => {
  it("play their ideas before earlyUntil, and the plain core from then on", () => {
    const weights = { ...EXPERIMENT.weights, stay: 0.6, stayFigure: 1 };
    const early = strategistBot(createRng(1), { ...EXPERIMENT, earlyIdeas: ["stay"], earlyUntil: 10, weights });
    const always = strategistBot(createRng(1), { ...EXPERIMENT, ideas: [...EXPERIMENT.ideas, "stay"], weights });
    const plain = strategistBot(createRng(1), EXPERIMENT);
    const gains = (bot, state) => bot.scoreMoves(state, legalMoves(state)).map(({ gain }) => gain);
    const [before, after] = [position(3, 8), position(3, 14)];
    assert.deepEqual(gains(early, before), gains(always, before));
    assert.deepEqual(gains(early, after), gains(plain, after));
    assert.notDeepEqual(gains(always, after), gains(plain, after), "the idea does weigh at turn 14 when it is on");
  });
});

describe("habits for the first turns only", () => {
  it("play a habit before earlyUntil, and leave it from then on", () => {
    const withoutJoker = HABITS.filter((habit) => habit !== "joker");
    const early = strategistBot(createRng(1), { ...EXPERIMENT, habits: withoutJoker, earlyHabits: ["joker"], earlyUntil: 10 });
    const always = strategistBot(createRng(1), EXPERIMENT);
    const never = strategistBot(createRng(1), { ...EXPERIMENT, habits: withoutJoker });
    const scores = (bot, state) => bot.scoreMoves(state, legalMoves(state)).map(({ move, gain }) => `${move.card}:${move.border}:${gain}`);
    const [before, after] = [position(5, 6), position(5, 16)];
    assert.deepEqual(scores(early, before), scores(always, before));
    assert.deepEqual(scores(early, after), scores(never, after));
  });
});

describe("ideas for the end of the game only", () => {
  it("leave an idea out before lateFrom, and play it from then on", () => {
    const without = EXPERIMENT.ideas.filter((idea) => idea !== "spread");
    const late = strategistBot(createRng(1), { ...EXPERIMENT, ideas: without, lateIdeas: ["spread"], lateFrom: 15 });
    const always = strategistBot(createRng(1), EXPERIMENT);
    const never = strategistBot(createRng(1), { ...EXPERIMENT, ideas: without });
    const scores = (bot, state) => bot.scoreMoves(state, legalMoves(state)).map(({ move, gain }) => `${move.card}:${move.border}:${gain}`);
    const [before, after] = [position(7, 6), position(7, 18)];
    assert.deepEqual(scores(late, before), scores(never, before));
    assert.deepEqual(scores(late, after), scores(always, after));
    assert.notDeepEqual(scores(always, before), scores(never, before), "spread does weigh at turn 6");
  });
});

describe("root candidate diversity (pickCandidates, ismcts+diverse)", () => {
  it("diverse=1 selects one move per distinct card first, then fills by gain", () => {
    const scored = [
      { move: { card: 1, border: 0 }, gain: 0.9 },
      { move: { card: 1, border: 1 }, gain: 0.8 },
      { move: { card: 1, border: 2 }, gain: 0.7 },
      { move: { card: 2, border: 0 }, gain: 0.6 },
      { move: { card: 2, border: 1 }, gain: 0.5 },
      { move: { card: 3, border: 0 }, gain: 0.4 },
      { move: { card: 4, border: 0 }, gain: 0.3 },
    ];
    // Baseline picks [1:0, 1:1, 1:2, 2:0] (only cards 1 and 2)
    assert.deepEqual(pickCandidates(scored, 4, 0).map((m) => m.card), [1, 1, 1, 2]);
    // Diverse=1 picks [1:0, 2:0, 3:0, 4:0] (all 4 distinct cards)
    assert.deepEqual(pickCandidates(scored, 4, 1).map((m) => m.card), [1, 2, 3, 4]);
    // Diverse=2 caps at 2 per card: [1:0, 1:1, 2:0, 2:1]
    assert.deepEqual(pickCandidates(scored, 4, 2).map((m) => m.card), [1, 1, 2, 2]);
  });
});
