import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { OFFICIAL_RULES } from "../src/config/rules.js";
import { createRng } from "../src/core/random.js";
import { finishLog, playLogged, rulesOf, startLog } from "../src/replay/log.js";
import { summarizeReplays } from "../src/replay/summary.js";
import { BOTS, pickBest } from "../src/sim/bots.js";
import { createGame, legalMoves } from "../src/sim/game.js";

/** A logged game where seat 0 is marked human but plays like the strategist. */
function humanLikeGame(seed) {
  const { spec, order, jokerRule, endMode } = rulesOf(OFFICIAL_RULES);
  const rng = createRng(seed);
  const state = createGame(spec, { order, jokerRule, endMode, rng });
  const players = [
    { seat: 0, kind: "human", name: "Test" },
    { seat: 1, kind: "bot", bot: "basique", version: "1.0.0" },
  ];
  const bots = [BOTS.strategist(rng), BOTS.greedy(rng)];
  const log = startLog(state, { rules: OFFICIAL_RULES, players, seed, startedAt: "2026-09-24T10:00:00+02:00" });
  while (!state.over) {
    const moves = legalMoves(state);
    const scored = bots[state.current].scoreMoves(state, moves);
    const move = pickBest(scored, rng);
    playLogged(log, state, move, state.current === 1 ? scored : null);
  }
  return finishLog(log, state, "2026-09-24T10:05:00+02:00");
}

describe("summarizeReplays", () => {
  const logs = [humanLikeGame(1), humanLikeGame(2)];
  const summary = summarizeReplays(logs, { advisor: BOTS.strategist(createRng(1)) });

  it("counts the human's results against each bot version", () => {
    const line = summary.vsBots["basique@1.0.0"];
    assert.equal(line.games, 2);
    assert.equal(line.won + line.lost + line.drawn, 2);
  });

  it("counts every settled line once, by side", () => {
    const total = (counts) => Object.values(counts).reduce((a, b) => a + b, 0);
    assert.equal(total(summary.formations.human), 14);
    assert.equal(total(summary.formations.bot), 14);
  });

  it("agrees with a human who plays exactly like the advisor", () => {
    assert.equal(summary.advice.moves, 42);
    assert.equal(summary.advice.agreed, 42);
    assert.deepEqual(summary.advice.examples, []);
  });

  it("skips unfinished logs", () => {
    const unfinished = { ...logs[0], result: null };
    assert.equal(summarizeReplays([unfinished]).advice.moves, 0);
  });
});
