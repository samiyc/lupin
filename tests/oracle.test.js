import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DECKS, JOKER_RULES } from "../src/config/decks.js";
import { ORDERS } from "../src/config/formations.js";
import { createRng } from "../src/core/random.js";
import { ORACLE, coreRanking, favouriteOf, needsSecondRun, rankOf, verdictOf } from "../src/replay/oracle.js";
import { BOTS, engineFor } from "../src/sim/bots.js";
import { applyMove, createGame, legalMoves } from "../src/sim/game.js";

const m = (card, border) => ({ card, border });

describe("the oracle", () => {
  it("ranks the core's moves, those its habits refuse last", () => {
    const ranking = coreRanking([{ move: m(1, 0), gain: 0.1 }, { move: m(2, 0), gain: 0.9, refused: true }, { move: m(3, 1), gain: 0.5 }]);
    assert.deepEqual(ranking, [m(3, 1), m(1, 0), m(2, 0)]);
    assert.equal(rankOf(ranking, m(2, 0)), 3);
  });

  it("calls a gap only when both runs agree on a move outside the core's top 3", () => {
    const ranking = [m(1, 0), m(2, 0), m(3, 0), m(4, 0), m(5, 0)];
    const runOn = (move) => [{ move, gain: 600 }, { move: m(1, 0), gain: 400 }];
    assert.equal(favouriteOf(runOn(m(5, 0))).share, 0.6);
    const agreed = verdictOf(ranking, [runOn(m(5, 0)), runOn(m(5, 0))]);
    assert.equal(agreed.gap, true);
    assert.equal(agreed.rank, 5);
    assert.equal(verdictOf(ranking, [runOn(m(5, 0)), runOn(m(4, 0))]).gap, false);
    assert.equal(verdictOf(ranking, [runOn(m(2, 0)), runOn(m(2, 0))]).gap, false);
    assert.equal(verdictOf(ranking, [runOn(m(5, 0))]).stable, null, "one run alone confirms nothing");
    assert.equal(verdictOf(ranking, [runOn(m(5, 0))]).gap, false);
  });

  it("asks for a second run only when the first leaves the core's top 3", () => {
    const ranking = [m(1, 0), m(2, 0), m(3, 0), m(4, 0)];
    assert.equal(needsSecondRun(ranking, [{ move: m(4, 0), gain: 9 }, { move: m(1, 0), gain: 1 }]), true);
    assert.equal(needsSecondRun(ranking, [{ move: m(2, 0), gain: 9 }, { move: m(4, 0), gain: 1 }]), false);
  });

  it("searches every legal move at the root", () => {
    const rng = createRng(4);
    const bots = [BOTS.strategist(rng), BOTS.strategist(rng)];
    const state = createGame(DECKS.classique, { order: ORDERS.original, jokerRule: JOKER_RULES.colorless, rng, endMode: "claim-end" });
    while (state.turn < 6) applyMove(state, bots[state.current].choose(state, legalMoves(state)));
    const moves = legalMoves(state);
    const scored = engineFor(`${ORACLE.engine}@${moves.length * 3}`)(createRng(1)).scoreMoves(state, moves, { keepAll: true });
    assert.ok(moves.length > ORACLE.shortlist);
    assert.equal(scored.length, moves.length);
  });
});
