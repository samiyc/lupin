import { botChoice } from "./runner.js";

/**
 * How the page asks a bot for its move. Most bots answer on the spot. A bot
 * of the line-up with a `think` setting (`src/config/bots.js`) — the
 * experimental one — thinks in a worker (`think-worker.js`): up to
 * `think.limitMs` a move, and during the human's turn too.
 *
 * `{ ponder(log), decide(state, log) → Promise<{ move, scored }>, stop() }`.
 */
const fallback = (thinker, player, state) => {
  thinker.last = { pondered: 0, rollouts: 0, thoughtMs: 0 };
  return botChoice(state, player);
};

export function createThinker(player, think, seed) {
  if (!think) return { ponder() {}, stop() {}, decide: async (state) => botChoice(state, player) };
  const worker = new Worker(new URL("./think-worker.js", import.meta.url), { type: "module" });
  worker.postMessage({ type: "init", engine: player.engine, seed, ...think });
  let answer = null;
  const thinker = { last: null };
  worker.onmessage = ({ data }) => {
    if (data.type === "move") {
      thinker.last = { pondered: data.pondered, rollouts: data.rollouts, thoughtMs: data.thoughtMs };
      answer?.(data);
    } else if (data.type === "error") answer?.(null);
  };
  worker.onerror = () => answer?.(null);
  const decide = (state, log) =>
    new Promise((resolve) => {
      const timer = setTimeout(() => answer?.(null), (think.limitMs ?? 10000) + 2000);
      answer = (res) => {
        clearTimeout(timer);
        answer = null;
        resolve(res ?? fallback(thinker, player, state));
      };
      worker.postMessage({ type: "decide", log });
    });
  return Object.assign(thinker, {
    ponder: (log) => worker.postMessage({ type: "ponder", log }),
    decide,
    stop: () => worker.terminate(),
  });
}
