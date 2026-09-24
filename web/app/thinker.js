import { botChoice } from "./runner.js";

/**
 * How the page asks a bot for its move. Most bots answer on the spot. A bot
 * of the line-up with a `think` setting (`src/config/bots.js`) — the
 * experimental one — thinks in a worker (`think-worker.js`): up to
 * `think.limitMs` a move, and during the human's turn too.
 *
 * `{ ponder(log), decide(state, log) → Promise<{ move, scored }>, stop() }`.
 */
export function createThinker(player, think, seed) {
  if (!think) {
    return { ponder() {}, stop() {}, decide: async (state) => botChoice(state, player) };
  }
  const worker = new Worker(new URL("./think-worker.js", import.meta.url), { type: "module" });
  worker.postMessage({ type: "init", engine: player.engine, seed, ...think });
  let answer = null;
  const thinker = { last: null };
  worker.onmessage = ({ data }) => {
    if (data.type !== "move") return;
    thinker.last = { pondered: data.pondered, rollouts: data.rollouts, thoughtMs: data.thoughtMs };
    answer?.(data);
  };
  return Object.assign(thinker, {
    ponder: (log) => worker.postMessage({ type: "ponder", log }),
    decide: (_state, log) =>
      new Promise((resolve) => {
        answer = resolve;
        worker.postMessage({ type: "decide", log });
      }),
    stop: () => worker.terminate(),
  });
}
