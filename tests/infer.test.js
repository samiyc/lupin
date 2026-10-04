import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DECKS, JOKER_RULES } from "../src/config/decks.js";
import { ORDERS } from "../src/config/formations.js";
import { createRng } from "../src/core/random.js";
import { applyMove, createGame, legalMoves } from "../src/sim/game.js";
import { inferredHands, pickHand } from "../src/sim/infer.js";
import { determinize, withoutCards } from "../src/sim/lookahead.js";
import { unseenCards } from "../src/sim/potential.js";

const freshGame = (seed) => createGame(DECKS.classique, { order: ORDERS.original, jokerRule: JOKER_RULES.colorless, rng: createRng(seed) });
const hiddenOf = (state, player) => unseenCards(state, player).entries.flatMap(([card, count]) => Array.from({ length: count }, () => card));
const sorted = (cards) => [...cards].sort((a, b) => a - b);

/** A judge that likes one card above all: the opponent who held it and played something else did not hold it. */
const fondOf = (card) => ({ scoreMoves: (position, moves) => moves.map((move) => ({ move, gain: move.card === card ? 1 : 0 })) });

describe("guessing the opponent's hand (infer.js, ismcts+infer)", () => {
  it("deals a given hand to the opponent and the rest of the unseen cards to the pile", () => {
    const state = freshGame(7);
    const hidden = hiddenOf(state, 0);
    const hand = hidden.slice(3, 3 + state.hands[1].length);
    const game = determinize(state, 0, createRng(1), hand);
    assert.deepEqual(game.hands[1], hand);
    assert.deepEqual(sorted([...game.hands[1], ...game.pile]), sorted(hidden));
    assert.deepEqual(sorted(withoutCards([1, 2, 2, 3], [2, 3])), [1, 2]);
  });

  it("reads nothing before the opponent has moved", () => {
    assert.equal(inferredHands(freshGame(8), fondOf(0), createRng(1), 16), null);
  });

  it("weighs the hands: one that holds the card the opponent would have played is unlikely", () => {
    const state = freshGame(9);
    const opening = legalMoves(state)[0];
    applyMove(state, opening);
    const reply = legalMoves(state).find((move) => move.card !== opening.card);
    applyMove(state, reply);
    const unseen = hiddenOf(state, 0).filter((card) => card !== reply.card);
    const tempting = unseen[0];
    const pool = inferredHands(state, fondOf(tempting), createRng(2), 64);
    assert.ok(pool, "a pool of hands");
    assert.ok(Math.abs(pool.at(-1).upTo - 1) < 1e-9);
    const draws = Array.from({ length: 400 }, (_, i) => pickHand(pool, createRng(100 + i)));
    const holding = draws.filter((hand) => hand.includes(tempting)).length / draws.length;
    assert.ok(holding < 0.05, `${holding}`);
    assert.ok(draws.every((hand) => hand.length === state.hands[1].length));
  });
});
