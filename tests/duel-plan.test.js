import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { PROFILES, duelVerdict, isSlowEngine } from "../scripts/lib/duel-plan.js";

describe("duel plans", () => {
  it("tell the searching engines from the fast ones", () => {
    assert.ok(isSlowEngine("lookahead"));
    assert.ok(isSlowEngine("experimental:400"));
    assert.ok(!isSlowEngine("strategist"));
    assert.ok(!isSlowEngine("idea:middle"));
  });

  it("keep the quick profile quick, and the long one longer", () => {
    for (const scale of ["fast", "slow"]) assert.ok(PROFILES.quick[scale].max < PROFILES.long[scale].max);
  });

  it("stop early only once the minimum is played and the result is clear", () => {
    assert.equal(duelVerdict({ wins: 70, games: 50, min: 100, max: 400 }).stop, false, "too early");
    const clear = duelVerdict({ wins: 280, games: 200, min: 100, max: 400 });
    assert.ok(clear.stop && clear.clear && clear.low > 0.5);
    const even = duelVerdict({ wins: 204, games: 200, min: 100, max: 400 });
    assert.equal(even.stop, false);
    const capped = duelVerdict({ wins: 408, games: 400, min: 100, max: 400 });
    assert.ok(capped.stop && !capped.clear && capped.low < 0.5);
    assert.ok(duelVerdict({ wins: 40, games: 30, min: 100, max: 400, outOfTime: true }).stop, "the clock stops it too");
    for (const name of ["quick", "long"]) assert.ok(PROFILES[name].seconds <= 1200);
  });
});
