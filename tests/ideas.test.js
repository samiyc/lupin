import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DECKS } from "../src/config/decks.js";
import { JOKER, cardOf } from "../src/core/cards.js";
import { IDEA_WEIGHTS, ideasBonus, solidStart } from "../src/sim/ideas.js";

const spec = DECKS.classique;
const at = (value, suit) => cardOf(spec, suit, value);
const HEART = 1;
const SPADE = 0;

/** A board seen from one player: seven borders, `mine` and `theirs` by index. */
function contextOf({ ideas, hand = [], mine = {}, theirs = {} }) {
  const sides = (spread) => Array.from({ length: 7 }, (_, i) => spread[i] ?? []);
  const mySides = sides(mine);
  const theirSides = sides(theirs);
  return {
    spec,
    ideas: new Set(ideas),
    weights: IDEA_WEIGHTS,
    hand,
    mySides,
    theirSides,
    boardCards: [...mySides, ...theirSides].flat(),
  };
}

describe("a solid start", () => {
  it("is three of a kind in hand, a joker counting as one", () => {
    const hand = [at(7, HEART), at(7, SPADE), JOKER, at(2, 3)];
    assert.ok(solidStart(contextOf({ ideas: [], hand }), at(7, HEART)));
    assert.ok(!solidStart(contextOf({ ideas: [], hand: [at(7, HEART), at(7, SPADE)] }), at(7, HEART)));
  });

  it("is two suited cards in a row with both ends unseen", () => {
    const hand = [at(4, HEART), at(5, HEART), at(9, SPADE)];
    assert.ok(solidStart(contextOf({ ideas: [], hand }), at(4, HEART)));
    const sixOut = contextOf({ ideas: [], hand, theirs: { 2: [at(6, HEART)] } });
    assert.ok(!solidStart(sixOut, at(4, HEART)), "6♥ already on the board closes the top end");
    const edge = [at(1, HEART), at(2, HEART)];
    assert.ok(!solidStart(contextOf({ ideas: [], hand: edge }), at(1, HEART)), "no card below the ace");
  });
});

describe("the ideas", () => {
  it("spread: no second lone 7", () => {
    const context = contextOf({ ideas: ["spread"], hand: [at(7, HEART)], mine: { 0: [at(7, SPADE)] } });
    assert.equal(ideasBonus(context, 5, at(7, HEART)), -IDEA_WEIGHTS.spread);
    assert.equal(ideasBonus(context, 5, at(8, HEART)), 0);
    assert.equal(ideasBonus(context, 0, at(7, HEART)), 0, "joining the 7 is not opening a new one");
  });

  it("middle: only a solid start opens the three central borders", () => {
    const weak = contextOf({ ideas: ["middle"], hand: [at(7, HEART), at(2, SPADE)] });
    assert.equal(ideasBonus(weak, 3, at(7, HEART)), -IDEA_WEIGHTS.middleWeak);
    assert.equal(ideasBonus(weak, 0, at(7, HEART)), 0);
    const solid = contextOf({ ideas: ["middle"], hand: [at(4, HEART), at(5, HEART)] });
    assert.equal(ideasBonus(solid, 2, at(4, HEART)), IDEA_WEIGHTS.middleSolid);
  });

  it("edges: a weak start goes to the sides", () => {
    const weak = contextOf({ ideas: ["edges"], hand: [at(7, HEART), at(2, SPADE)] });
    assert.equal(ideasBonus(weak, 6, at(7, HEART)), IDEA_WEIGHTS.edges);
    assert.equal(ideasBonus(weak, 3, at(7, HEART)), 0);
  });

  it("counter: the same shape one notch higher", () => {
    const theirs = { 4: [at(4, SPADE), at(5, SPADE), at(6, SPADE)] };
    const context = contextOf({ ideas: ["counter"], mine: { 4: [at(5, HEART)] }, theirs });
    assert.equal(ideasBonus(context, 4, at(6, HEART)), IDEA_WEIGHTS.counter);
    assert.equal(ideasBonus(context, 4, at(4, HEART)), 0, "lower does not counter");
    const empty = contextOf({ ideas: ["counter"] });
    assert.equal(ideasBonus(empty, 1, at(6, HEART)), -IDEA_WEIGHTS.exposed);
  });
});
