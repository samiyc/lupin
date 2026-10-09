import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { FIGURE_IDS, figureByKey } from "../src/core/figures.js";
import { bordersFor, figuresFor, stepOf } from "../web/app/figure-input.js";

const swap = figureByKey("swap").id;
const sum = figureByKey("sum").id;

describe("the extension in the page (web/app/figure-input.js)", () => {
  it("draws the bonus figures from the seed, none for the base game", () => {
    assert.deepEqual(figuresFor(7, 0), []);
    assert.equal(figuresFor(7, 3).length, 3);
    assert.deepEqual(figuresFor(7, 3), figuresFor(7, 3));
    assert.deepEqual([...figuresFor(7, 6)].sort(), [...FIGURE_IDS].sort());
  });

  it("lays a figure in one click, the Dame de Cœur in two", () => {
    assert.deepEqual(stepOf(sum, 2, null), { move: { card: sum, border: 2 } });
    assert.deepEqual(stepOf(swap, 2, null), { pending: { border: 2 } });
    assert.deepEqual(stepOf(swap, 5, { border: 2 }), { move: { card: swap, border: 2, target: 5 } });
    const minusTen = figureByKey("minusTen").id;
    assert.deepEqual(stepOf(minusTen, 3, null), { pending: { card: minusTen, border: 3, action: "discard" } });
    assert.deepEqual(stepOf(minusTen, 3, { card: minusTen, border: 3, action: "discard" }), { move: { card: minusTen, border: 3 } });
    assert.deepEqual(stepOf(minusTen, 3, null, { pile: 0 }), { move: { card: minusTen, border: 3 } });
  });

  it("offers the Dame de Cœur's borders, then the ones she may swap with", () => {
    const moves = [{ card: swap, border: 1, target: 3 }, { card: swap, border: 1, target: 4 }, { card: swap, border: 3, target: 1 }, { card: sum, border: 6 }];
    assert.deepEqual([...bordersFor(moves, swap, null)], [1, 3]);
    assert.deepEqual([...bordersFor(moves, swap, { border: 1 })], [3, 4]);
    assert.deepEqual([...bordersFor(moves, sum, null)], [6]);
  });
});
