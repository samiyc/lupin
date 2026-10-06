import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buttonsFor, countIn, favoritesOnly, puzzleStatus, statusLine, toggleFavorite, unsolvedOnly } from "../web/app/puzzle-kinds.js";

describe("where a puzzle stands", () => {
  it("is playing until it is over, then solved, helped or lost", () => {
    assert.equal(puzzleStatus(null), "playing");
    assert.equal(puzzleStatus({ won: true, helped: false }), "solved");
    assert.equal(puzzleStatus({ won: true, helped: true }), "helped");
    assert.equal(puzzleStatus({ won: false, helped: false }), "lost");
  });

  it("turns the next button green once won, reveal and retry once lost", () => {
    assert.deepEqual(buttonsFor("playing"), { next: false, reveal: false, retry: false });
    assert.deepEqual(buttonsFor("solved"), { next: true, reveal: false, retry: false });
    assert.deepEqual(buttonsFor("lost"), { next: false, reveal: true, retry: true });
    assert.equal(statusLine("playing"), null);
    assert.equal(statusLine("solved").tone, "won");
    assert.equal(statusLine("lost").tone, "lost");
  });

  it("keeps favourites by id, and can draw from them alone", () => {
    assert.deepEqual(toggleFavorite([3, 7], 5), [3, 7, 5]);
    assert.deepEqual(toggleFavorite([3, 7], 7), [3]);
    const list = [{ id: 1 }, { id: 2 }, { id: 3 }];
    assert.deepEqual(favoritesOnly([2, 0, 1], list, new Set([3, 1])), [2, 0]);
    assert.deepEqual(favoritesOnly([2, 0, 1], list, new Set()), [2, 0, 1], "no favourite: the whole order");
  });

  it("keeps the unsolved puzzles, or the whole order once all are solved", () => {
    const list = [{ id: 1 }, { id: 2 }, { id: 3 }];
    assert.deepEqual(unsolvedOnly([2, 0, 1], list, new Set([3])), [0, 1]);
    assert.deepEqual(unsolvedOnly([2, 0, 1], list, new Set([1, 2, 3])), [2, 0, 1], "all solved: the whole order");
  });
});

describe("the puzzle counters", () => {
  it("count only the ids of puzzles still in the file", () => {
    const list = [{ id: 2 }, { id: 3 }, { id: 291 }];
    assert.equal(countIn(list, new Set([1, 2, 3, 7, 13])), 2, "1, 7 and 13 left the file");
    assert.equal(countIn(list, new Set()), 0);
  });
});
