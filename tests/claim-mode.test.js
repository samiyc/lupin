import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DECKS, JOKER_RULES } from "../src/config/decks.js";
import { ORDERS } from "../src/config/formations.js";
import { OFFICIAL_RULES } from "../src/config/rules.js";
import { createRng } from "../src/core/random.js";
import { replayStates, finishLog, playLogged, startLog } from "../src/replay/log.js";
import { BOTS } from "../src/sim/bots.js";
import { isClaimable } from "../src/sim/certainty.js";
import { applyMove, canPlace, createGame, legalMoves, playGame } from "../src/sim/game.js";

const spec = DECKS.classique;
const rules = { order: ORDERS.original, jokerRule: JOKER_RULES.colorless };

function play(seed, endMode, players = ["strategist", "greedy"]) {
  const rng = createRng(seed);
  const bots = players.map((id) => BOTS[id](rng));
  return playGame(spec, { ...rules, rng, bots, endMode });
}

/** A whole `final` game, with every border that could have been claimed along the way. */
function claimableOverGame(seed) {
  const rng = createRng(seed);
  const bots = [BOTS.random(rng), BOTS.greedy(rng)];
  const state = createGame(spec, { ...rules, rng, endMode: "final" });
  const claims = [];
  while (!state.over) {
    state.borders.forEach((_, border) => {
      if (isClaimable(state, border, state.current)) claims.push({ player: state.current, border, turn: state.turn });
    });
    const moves = legalMoves(state);
    applyMove(state, moves.length ? bots[state.current].choose(state, moves) : null);
  }
  return { state, claims };
}

describe("endMode: claim", () => {
  it("is the page's rule", () => {
    assert.equal(OFFICIAL_RULES.endMode, "claim");
  });

  it("never claims a border the rest of the game would have lost, over 60 whole games", () => {
    let checked = 0;
    for (let seed = 1; seed <= 60; seed += 1) {
      const { state, claims } = claimableOverGame(seed);
      for (const { player, border, turn } of claims) {
        assert.equal(state.borders[border].owner, player, `game ${seed}, turn ${turn}, border ${border + 1}`);
        checked += 1;
      }
    }
    assert.ok(checked > 300, `only ${checked} claims were checked`);
  });

  it("settles borders during the game and stops at the first victory", () => {
    let early = 0;
    for (let seed = 1; seed <= 20; seed += 1) {
      const state = play(seed, "claim");
      assert.ok(state.over);
      const cardsLeft = state.pile.length + state.hands[0].length + state.hands[1].length;
      if (cardsLeft > 0) early += 1;
      const claimed = state.resolved.filter((entry) => entry.claimedAt !== undefined);
      assert.ok(claimed.length > 0, `game ${seed} claimed nothing`);
      for (const entry of claimed) assert.equal(state.borders[entry.border].owner, entry.winner);
    }
    assert.ok(early >= 10, `only ${early} games in 20 ended before the last card`);
  });

  it("closes a claimed border to both players", () => {
    const state = play(4, "claim");
    const claimed = state.resolved.find((entry) => entry.claimedAt !== undefined);
    for (const player of [0, 1]) for (const card of [1, 2, 3]) assert.equal(canPlace(state, player, card, claimed.border), false);
  });

  it("names the same winner as the final mode in most games, over 200", () => {
    let same = 0;
    for (let seed = 1; seed <= 200; seed += 1) if (play(seed, "claim").winner === play(seed, "final").winner) same += 1;
    // A claimed border takes no more cards, so the games themselves differ: this is a measure, not an identity.
    assert.ok(same >= 150, `${same} / 200`);
  });

  it("replays a logged game move for move, claims included", () => {
    const rng = createRng(21);
    const bots = [BOTS.strategist(rng), BOTS.greedy(rng)];
    const state = createGame(spec, { ...rules, rng, endMode: "claim" });
    const log = startLog(state, { rules: { deck: "classique", jokerRule: "colorless", order: "original", endMode: "claim" }, players: [], seed: 21 });
    while (!state.over) {
      const moves = legalMoves(state);
      playLogged(log, state, moves.length ? bots[state.current].choose(state, moves) : null);
    }
    finishLog(log, state);
    const last = replayStates(log).at(-1).state;
    assert.deepEqual(last.resolved, state.resolved);
    assert.equal(last.winner, state.winner);
  });
});
