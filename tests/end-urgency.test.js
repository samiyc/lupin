import test from "node:test";
import assert from "node:assert/strict";
import { DECKS, JOKER_RULES } from "../src/config/decks.js";
import { ORDERS } from "../src/config/formations.js";
import { createGame } from "../src/sim/game.js";
import { withEndUrgency } from "../src/sim/end-urgency.js";

test("endUrgency", async (t) => {
  await t.test("leaves moves untouched while the pile is not empty", () => {
    const game = createGame(DECKS.classique, { order: ORDERS.original, jokerRule: JOKER_RULES.colorless, endMode: "claim-end", deck: [] });
    game.pile = [40, 41];
    const gainOf = withEndUrgency(game, [{ card: 10, border: 0 }], () => 0.4, { costOf: () => 0.1, on: true });
    assert.equal(gainOf({ card: 10, border: 0 }), 0.4);
  });

  await t.test("leaves moves untouched when on is false", () => {
    const game = createGame(DECKS.classique, { order: ORDERS.original, jokerRule: JOKER_RULES.colorless, endMode: "claim-end", deck: [] });
    game.pile = [];
    const gainOf = withEndUrgency(game, [{ card: 10, border: 0 }], () => 0.4, { costOf: () => 0.1, on: false });
    assert.equal(gainOf({ card: 10, border: 0 }), 0.4);
  });

  await t.test("prioritizes completing a 2-card border when pile is empty", () => {
    const game = createGame(DECKS.classique, { order: ORDERS.original, jokerRule: JOKER_RULES.colorless, endMode: "claim-end", deck: [] });
    game.pile = [];
    // Border 0 has 2 cards, Border 1 has 1 card
    game.borders[0].sides[game.current] = [0, 1];
    game.borders[1].sides[game.current] = [2];

    const gainOf = withEndUrgency(
      game,
      [
        { card: 5, border: 0 },
        { card: 5, border: 1 },
      ],
      () => 0.5,
      { costOf: () => 0.1, on: true },
    );

    const gainComplete = gainOf({ card: 5, border: 0 });
    const gainScatter = gainOf({ card: 5, border: 1 });

    assert.ok(gainComplete > gainScatter, "completing 2-card border should score strictly higher than scattering");
  });
});
