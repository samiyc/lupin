import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { BOT_IDS, BOT_LINEUP, DEFAULT_OPPONENT, botTag, engineOf } from "../src/config/bots.js";
import { DECKS, JOKER_RULES } from "../src/config/decks.js";
import { ORDERS } from "../src/config/formations.js";
import { createRng } from "../src/core/random.js";
import { BOTS } from "../src/sim/bots.js";
import { createGame, legalMoves } from "../src/sim/game.js";

describe("the bot line-up", () => {
  it("has the three majors, each on an existing engine", () => {
    assert.deepEqual(BOT_IDS, ["basique", "stratege", "experimental"]);
    for (const id of BOT_IDS) assert.ok(engineOf(id) in BOTS, id);
    assert.ok(BOT_IDS.includes(DEFAULT_OPPONENT));
  });

  it("gives every bot a semantic version and a tag for the replays", () => {
    for (const id of BOT_IDS) assert.match(BOT_LINEUP[id].version, /^\d+\.\d+\.\d+$/);
    assert.equal(botTag("stratege"), `stratege@${BOT_LINEUP.stratege.version}`);
  });

  it("refuses an unknown bot", () => {
    assert.throws(() => engineOf("champion"));
  });
});

describe("scoreMoves", () => {
  const state = createGame(DECKS.classique, {
    order: ORDERS.original,
    jokerRule: JOKER_RULES.colorless,
    rng: createRng(5),
  });
  const moves = legalMoves(state);

  for (const id of ["random", "greedy", "strategist", "experimental"]) {
    it(`${id} scores candidates, and its choice is among the best scored`, () => {
      const bot = BOTS[id](createRng(1));
      const scored = bot.scoreMoves(state, moves);
      assert.ok(scored.length > 0 && scored.length <= moves.length);
      const choice = bot.choose(state, moves);
      if (id === "random") return;
      const top = Math.max(...scored.map((entry) => entry.gain));
      const chosen = scored.find((entry) => entry.move.card === choice.card && entry.move.border === choice.border);
      assert.ok(Math.abs(chosen.gain - top) < 1e-9);
    });
  }

  it("the experimental bot starts identical to the strategist", () => {
    const strategist = BOTS.strategist(createRng(1)).scoreMoves(state, moves);
    const experimental = BOTS.experimental(createRng(1)).scoreMoves(state, moves);
    assert.deepEqual(experimental, strategist);
  });
});
