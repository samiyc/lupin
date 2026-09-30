import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DECKS, JOKER_RULES } from "../src/config/decks.js";
import { ORDERS } from "../src/config/formations.js";
import { createRng } from "../src/core/random.js";
import { BOTS } from "../src/sim/bots.js";
import { applyMove, createGame, legalMoves } from "../src/sim/game.js";
import { bookReader, canonicalKey, encodeBook, fromCanonical, recolour, toCanonical } from "../src/sim/openings.js";

const spec = DECKS.classique;
const rules = { order: ORDERS.original, jokerRule: JOKER_RULES.colorless };

/** A seeded position `moves` moves in. */
function position(seed, moves) {
  const rng = createRng(seed);
  const bots = [BOTS.greedy(rng), BOTS.greedy(rng)];
  const state = createGame(spec, { ...rules, rng, endMode: "claim-end" });
  while (state.turn < moves) applyMove(state, bots[state.current].choose(state, legalMoves(state)));
  return state;
}

/** `state` with every card recoloured by `colors`, and the borders reversed when `mirror`. */
function transformed(state, colors, mirror) {
  const map = (cards) => cards.map((card) => recolour(spec, card, colors));
  const borders = state.borders.map((border) => ({ ...border, sides: border.sides.map(map) }));
  return { ...state, hands: state.hands.map(map), borders: mirror ? [...borders].reverse() : borders };
}

describe("opening keys", () => {
  it("give a position and all its recolourings and mirror the same key", () => {
    const state = position(3, 3);
    const { key } = canonicalKey(state);
    for (const colors of [[1, 0, 2, 3], [3, 2, 1, 0], [2, 3, 0, 1]]) {
      for (const mirror of [false, true]) assert.equal(canonicalKey(transformed(state, colors, mirror)).key, key);
    }
  });

  it("tell different positions apart", () => {
    const keys = new Set(Array.from({ length: 40 }, (_, seed) => canonicalKey(position(seed + 1, 0)).key));
    assert.equal(keys.size, 40);
  });

  it("bring a stored move back in the position's own colours and direction", () => {
    const state = transformed(position(5, 2), [2, 0, 3, 1], true);
    const { symmetry } = canonicalKey(state);
    for (const move of legalMoves(state)) assert.deepEqual(fromCanonical(spec, toCanonical(spec, move, symmetry), symmetry), move);
  });
});

describe("the opening book file", () => {
  it("finds every stored key, and nothing else", () => {
    const entries = Array.from({ length: 300 }, (_, i) => ({ key: `k${i}`, move: { card: (i % 41) - 1, border: i % 7 }, visits: i }));
    const book = bookReader(encodeBook(entries));
    assert.equal(book.count, 300);
    for (const { key, move } of entries) assert.deepEqual(book.lookup(key), move);
    assert.equal(book.lookup("absent"), null);
  });
});
