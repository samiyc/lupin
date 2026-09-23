import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { REPLAY_DIRS, isReplayDir, isSafeName, replayFileName, replayHeader } from "../scripts/lib/replay-files.js";

const log = {
  startedAt: "2026-09-24T10:15:30.123Z",
  players: [
    { seat: 1, kind: "bot", bot: "stratege", version: "1.0.0" },
    { seat: 0, kind: "human", name: "Sami" },
  ],
  turns: [{}, {}],
  result: { winner: 0, winType: "adjacent" },
};

describe("replay file names", () => {
  it("are dated and name both seats, first player first", () => {
    assert.equal(replayFileName(log), "2026-09-24_10-15-30_sami-vs-stratege.json");
  });

  it("are safe to serve and nothing else is", () => {
    assert.ok(isSafeName(replayFileName(log)));
    for (const bad of ["../package.json", "a/b.json", "..json", "x.txt", "", "x.json/..", null]) {
      assert.equal(isSafeName(bad), false, String(bad));
    }
  });

  it("live in two known folders only", () => {
    assert.deepEqual(REPLAY_DIRS, { recent: "replays", kept: "data/replays" });
    assert.ok(isReplayDir("kept"));
    assert.ok(!isReplayDir("../src"));
    assert.ok(!isReplayDir("toString"));
  });

  it("list with a small header, not the whole log", () => {
    assert.deepEqual(replayHeader("recent", "x.json", log), {
      dir: "recent",
      name: "x.json",
      startedAt: log.startedAt,
      players: log.players,
      turns: 2,
      winner: 0,
      winType: "adjacent",
    });
  });
});
