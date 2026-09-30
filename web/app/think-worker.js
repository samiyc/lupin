import { createRng } from "../../src/core/random.js";
import { stateAt } from "../../src/replay/log.js";
import { engineFor } from "../../src/sim/bots.js";
import { legalMoves } from "../../src/sim/game.js";
import { CREDIT, createPonder } from "../../src/sim/ponder.js";

/**
 * The experimental bot's own thread (`thinker.js` talks to it). It searches
 * without freezing the page, and during the human's turn it ponders its
 * reply (`src/sim/ponder.js`). A move gets `limitMs` of thought, minus
 * `CREDIT` of the time pondered, but never less than `minMs`: a human who
 * thought 20 s gets an answer at once.
 *
 * Messages in: `init { engine, seed, limitMs, minMs }`, `ponder { log }` (the
 * human is to move), `decide { log }` (the bot is to move), `stop`.
 * Message out: `move { move, scored, pondered, rollouts, thoughtMs }`.
 */
const SLICE_MS = 25;
let bot = null;
let limits = { limitMs: 10000, minMs: 400 };
let ponder = null;

const now = () => performance.now();
const current = (log) => stateAt(log, log.turns.length + 1);
const breathe = () => new Promise((resolve) => setTimeout(resolve, 0));

/** Works on `mine` a slice at a time, until it is replaced or has nothing left to do. */
async function keepPondering(mine) {
  while (ponder === mine && mine.work(SLICE_MS)) await breathe();
}

/** Searches the reply, starting from what pondering learned (`taken`: `{ warm, spentMs }`). */
function searchReply(state, moves, { warm, spentMs }) {
  const started = now();
  const search = bot.searchFor(state, moves, {}, { warm });
  const budget = Math.max(limits.minMs, limits.limitMs - CREDIT * spentMs);
  while (!search.done() && now() - started < budget) search.step();
  return { move: search.best(), scored: search.scored(), pondered: Math.round(spentMs), rollouts: search.rollouts(), thoughtMs: Math.round(now() - started) };
}

/** A small endgame, solved exactly (Expérimental 0.7): no search, no clock. */
function solvedReply(state, moves) {
  const started = now();
  const scored = bot.scoreMoves(state, moves);
  const best = scored.reduce((a, b) => (b.gain > a.gain ? b : a));
  return { move: best.move, scored, pondered: 0, rollouts: 0, thoughtMs: Math.round(now() - started) };
}

function decide(log) {
  const state = current(log);
  const moves = legalMoves(state);
  const taken = ponder?.take() ?? { warm: null, spentMs: 0 };
  ponder = null;
  if (bot.solves?.(state, moves)) return solvedReply(state, moves);
  if (moves.length > 1) return searchReply(state, moves, taken);
  return { move: moves[0] ?? null, scored: bot.scoreMoves(state, moves), pondered: 0, rollouts: 0, thoughtMs: 0 };
}

const HANDLERS = {
  init({ engine, seed, limitMs, minMs }) {
    bot = engineFor(engine)(createRng(seed));
    limits = { limitMs, minMs };
  },
  ponder({ log }) {
    ponder = createPonder(current(log), bot, { limitMs: limits.limitMs / CREDIT, seed: log.turns.length + 1 });
    keepPondering(ponder);
  },
  decide({ log }) {
    postMessage({ type: "move", ...decide(log) });
  },
  stop() {
    ponder = null;
  },
};

onmessage = ({ data }) => HANDLERS[data.type]?.(data);
