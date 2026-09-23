import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DECKS } from "../src/config/decks.js";
import { OFFICIAL_RULES } from "../src/config/rules.js";
import { JOKER, cardOf } from "../src/core/cards.js";
import { createRng } from "../src/core/random.js";
import { rulesOf, snapshot } from "../src/replay/log.js";
import { BOTS } from "../src/sim/bots.js";
import { applyMove, createGame, legalMoves } from "../src/sim/game.js";
import { moveCard, sortBySuit, sortByValue, syncOrder } from "../web/app/hand.js";
import { cardView, tableView } from "../web/app/view.js";

const spec = DECKS.classique;
const at = (value, suit) => cardOf(spec, suit, value);

describe("the hand order", () => {
  it("keeps the player's order through plays and draws, jokers included", () => {
    const order = [at(9, 0), JOKER, at(2, 1), JOKER];
    const hand = [JOKER, at(2, 1), at(7, 3), JOKER];
    assert.deepEqual(syncOrder(order, hand), [JOKER, at(2, 1), JOKER, at(7, 3)]);
  });

  it("moves a card to a new place", () => {
    assert.deepEqual(moveCard([1, 2, 3, 4], 0, 2), [2, 3, 1, 4]);
    assert.deepEqual(moveCard([1, 2, 3, 4], 3, 0), [4, 1, 2, 3]);
    assert.deepEqual(moveCard([1, 2, 3], 5, 0), [1, 2, 3]);
  });

  it("sorts by suit or by value, jokers last", () => {
    const hand = [JOKER, at(5, 2), at(3, 0), at(5, 0)];
    assert.deepEqual(sortBySuit(spec, hand), [at(3, 0), at(5, 0), at(5, 2), JOKER]);
    assert.deepEqual(sortByValue(spec, hand), [at(3, 0), at(5, 0), at(5, 2), JOKER]);
    assert.deepEqual(sortByValue(spec, [at(5, 2), at(3, 3)]), [at(3, 3), at(5, 2)]);
  });
});

describe("the table view", () => {
  const { order, jokerRule, endMode } = rulesOf(OFFICIAL_RULES);
  const rng = createRng(4);
  const state = createGame(spec, { order, jokerRule, endMode, rng });

  it("draws cards with their value, suit and ink", () => {
    assert.deepEqual(cardView(spec, at(7, 1)), { id: at(7, 1), text: "7♥", value: "7", suit: "♥", red: true, joker: false });
    assert.equal(cardView(spec, JOKER).joker, true);
  });

  it("hides the opponent's hand when playing, shows it when observing", () => {
    const playing = tableView(spec, snapshot(state), { bottom: 0 });
    assert.equal(playing.top.hidden, true);
    assert.deepEqual(playing.top.cards, []);
    assert.equal(playing.top.count, 6);
    const observing = tableView(spec, snapshot(state), { bottom: 0, reveal: true });
    assert.equal(observing.top.cards.length, 6);
  });

  it("gives the turn number and the pile, and whose turn it is", () => {
    const view = tableView(spec, snapshot(state), { bottom: 1 });
    assert.equal(view.turn, 1);
    assert.equal(view.pile, 30);
    assert.equal(view.current, "top");
  });

  it("keeps stones grey during the game, then green or red from the bottom's side", () => {
    const bots = [BOTS.greedy(rng), BOTS.strategist(rng)];
    while (!state.over) applyMove(state, bots[state.current].choose(state, legalMoves(state)));
    const snap = snapshot(state);
    const before = tableView(spec, snap, { bottom: 0, shown: 0 });
    assert.ok(before.borders.every((border) => border.stone.state === "neutral"));
    assert.equal(before.result, null);
    const after = tableView(spec, snap, { bottom: 0 });
    for (const border of after.borders) {
      const owner = snap.borders[border.index].owner;
      assert.equal(border.stone.state, owner === 0 ? "won" : "lost");
      assert.equal(border.stone.toward, owner === 0 ? "bottom" : "top");
      assert.ok(border.formations.top && border.formations.bottom);
    }
    assert.equal(after.result.outcome, snap.winner === 0 ? "bottom" : "top");
  });
});
