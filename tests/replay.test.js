import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DECKS } from "../src/config/decks.js";
import { JOKER, cardOf } from "../src/core/cards.js";
import { formatCard, parseCard } from "../src/core/notation.js";
import { createRng } from "../src/core/random.js";
import { REPLAY_FORMAT, finishLog, playLogged, replayStates, rulesOf, snapshot, startLog } from "../src/replay/log.js";
import { BOTS } from "../src/sim/bots.js";
import { createGame, legalMoves } from "../src/sim/game.js";

const RULES = { deck: "classique", jokerRule: "colorless", order: "original", endMode: "final" };

/** A whole bot-against-bot game, logged the way the web page logs it. */
function loggedGame(seed) {
  const { spec, order, jokerRule, endMode } = rulesOf(RULES);
  const rng = createRng(seed);
  const state = createGame(spec, { order, jokerRule, endMode, rng });
  const bots = [BOTS.strategist(rng), BOTS.greedy(rng)];
  const players = [
    { seat: 0, kind: "bot", bot: "stratege", version: "1.0.0" },
    { seat: 1, kind: "bot", bot: "basique", version: "1.0.0" },
  ];
  const log = startLog(state, { rules: RULES, players, seed, startedAt: "2026-09-24T10:00:00.000Z" });
  while (!state.over) {
    const moves = legalMoves(state);
    const bot = bots[state.current];
    if (moves.length === 0) playLogged(log, state, null);
    else playLogged(log, state, bot.choose(state, moves), bot.scoreMoves(state, moves));
  }
  finishLog(log, state, "2026-09-24T10:05:00.000Z");
  return { log, state };
}

describe("notation", () => {
  const spec = DECKS.classique;
  it("writes and reads every card of the deck", () => {
    for (let card = 0; card < 40; card += 1) assert.equal(parseCard(spec, formatCard(spec, card)), card);
    assert.equal(formatCard(spec, JOKER), "JK");
    assert.equal(formatCard(spec, cardOf(spec, 1, 10)), "10♥");
  });
});

describe("replay logs", () => {
  const { log, state } = loggedGame(21);

  it("records the deck, every turn and the result, in plain JSON", () => {
    assert.equal(log.format, REPLAY_FORMAT);
    assert.equal(log.deck.length, 42);
    assert.equal(log.turns.length, 42);
    assert.equal(log.result.borders.length, 7);
    assert.deepEqual(JSON.parse(JSON.stringify(log)), log);
  });

  it("describes each move: hand, border before the move, draw, bot candidates", () => {
    const [first] = log.turns;
    assert.equal(first.turn, 1);
    assert.equal(first.hand.length, 6);
    assert.equal(first.pile, 30);
    assert.ok(first.side.wasEmpty);
    assert.ok(first.move.border >= 1 && first.move.border <= 7);
    assert.ok(typeof first.drew === "string");
    assert.ok(first.candidates.length > 0 && first.candidates.length <= 5);
    assert.equal(log.turns.at(-1).drew, null);
  });

  it("rebuilds the very same game, move by move", () => {
    const frames = replayStates(JSON.parse(JSON.stringify(log)));
    assert.equal(frames.length, 43);
    assert.deepEqual(frames.at(-1).state, snapshot(state));
    assert.equal(frames[0].state.hands[0].length, 6);
  });

  it("refuses a log whose move was not legal, or whose draw differs", () => {
    const illegal = structuredClone(log);
    illegal.turns[1].move.border = illegal.turns[0].move.border;
    illegal.turns[1].player = 0;
    assert.throws(() => replayStates(illegal), /Replay invalide/);
    const redrawn = structuredClone(log);
    redrawn.turns[0].drew = redrawn.turns[0].drew === "1♠" ? "2♠" : "1♠";
    assert.throws(() => replayStates(redrawn), /pioche/);
    assert.throws(() => replayStates({ ...log, format: "autre/9" }), /Format/);
  });
});
