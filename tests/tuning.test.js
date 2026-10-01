import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { BOT_PARAMS } from "../src/sim/bots.js";
import { ROLLOUT_CORE, TUNED, coreSettings, startingWeights } from "../src/sim/tuning.js";

describe("the core's tuning", () => {
  it("starts from the weights the core plays with today", () => {
    const settings = coreSettings(startingWeights());
    assert.deepEqual(settings.params, BOT_PARAMS);
    assert.deepEqual(settings.strategy, ROLLOUT_CORE.strategy);
    assert.deepEqual(settings.weights, ROLLOUT_CORE.weights);
    assert.ok(!settings.ideas.includes("certain"), "the rollouts never ran certainties");
  });

  it("moves one weight without touching the others, and keeps it in bounds", () => {
    const spread = coreSettings({ spread: 0.9 });
    assert.equal(spread.weights.spread, 0.9);
    assert.equal(spread.weights.connector, ROLLOUT_CORE.weights.connector);
    const floor = TUNED.find(({ key }) => key === "temperature").min;
    assert.equal(coreSettings({ temperature: -1 }).params.temperature, floor);
  });
});
