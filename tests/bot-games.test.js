import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DECKS, JOKER_RULES } from "../src/config/decks.js";
import { ORDERS } from "../src/config/formations.js";
import { TURNING_TURN, balancedGames, playRecordedBatch } from "../src/replay/bot-games.js";
import { replayStates, stateAt } from "../src/replay/log.js";

const spec = DECKS.classique;
const batch = playRecordedBatch(spec, {
  games: 6,
  seed: 11,
  players: ["greedy", "strategist"],
  labels: ["basique@1.0.0", "strategist"],
  ids: { deck: "classique", jokerRule: "colorless", order: "original" },
  order: ORDERS.original,
  jokerRule: JOKER_RULES.colorless,
  deals: 400,
  endMode: "claim-end",
});

describe("duels kept as replays", () => {
  it("log every game, replayable to its end with the same result", () => {
    assert.equal(batch.logs.length, 6);
    assert.equal(batch.wins[0] + batch.wins[1] + batch.draws, 6);
    for (const log of batch.logs) {
      const frames = replayStates(log);
      assert.equal(frames.at(-1).state.winner, log.result.winner);
      assert.deepEqual(log.players.map((player) => player.version), ["basique@1.0.0", "strategist"]);
    }
  });

  it("name who holds the game once the pile is empty, by exact play", () => {
    for (const log of batch.logs) {
      const { advantage, handClasses } = log.analysis;
      assert.equal(handClasses.length, 2);
      if (advantage.ended) continue;
      assert.equal(stateAt(log, TURNING_TURN + 1).pile.length, 0);
      assert.ok([1, 0, -1].includes(advantage.value));
      assert.ok(advantage.winner === null || advantage.winner === 0 || advantage.winner === 1);
    }
  });

  it("keep only games where both starting hands are medium, when asked", () => {
    for (const log of balancedGames(batch.logs)) assert.deepEqual(log.analysis.handClasses, ["medium", "medium"]);
  });
});
