import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DECKS } from "../src/config/decks.js";
import { JOKER, cardOf } from "../src/core/cards.js";
import { oracleBonus } from "../src/sim/oracle-ideas.js";

const spec = DECKS.classique;
const c = (color, value) => cardOf(spec, color, value);
const weights = { stay: 0.4, noAnswer: 0.1, noBlindOpen: 0.2 };
const context = (ideas, { mine = [], theirs = [], hand = [] } = {}) => ({ spec, weights, ideas: new Set(ideas), mySides: [mine], theirSides: [theirs], hand });

describe("bonuses that follow the oracle", () => {
  it("reward a card on a side already started, and only there", () => {
    assert.equal(oracleBonus(context(["stay"], { mine: [c(0, 5)] }), 0, c(1, 5)), 0.4);
    assert.equal(oracleBonus(context(["stay"]), 0, c(1, 5)), 0);
  });

  it("make answering an opposing card pay", () => {
    assert.equal(oracleBonus(context(["noAnswer"], { theirs: [c(2, 7)] }), 0, c(1, 8)), -0.1);
    assert.equal(oracleBonus(context(["noAnswer"]), 0, c(1, 8)), 0);
  });

  it("make opening an untouched border pay when nothing in hand would build on it", () => {
    const card = c(0, 5);
    assert.equal(oracleBonus(context(["noBlindOpen"], { hand: [card, c(2, 9)] }), 0, card), -0.2);
    assert.equal(oracleBonus(context(["noBlindOpen"], { hand: [card, c(3, 5)] }), 0, card), 0, "a pair in hand");
    assert.equal(oracleBonus(context(["noBlindOpen"], { hand: [card, c(0, 6)] }), 0, card), 0, "a suited neighbour in hand");
    assert.equal(oracleBonus(context(["noBlindOpen"], { hand: [JOKER] }), 0, JOKER), 0);
  });

  it("cost nothing when none of them is on", () => {
    assert.equal(oracleBonus(context([], { mine: [c(0, 5)] }), 0, c(1, 5)), 0);
  });
});
