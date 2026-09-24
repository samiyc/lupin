import { wilson } from "../../src/irl/analysis.js";

/**
 * How many games a duel plays, and when it may stop early. Pure, tested.
 *
 * A bot that looks ahead costs seconds a game where the core costs
 * milliseconds, so each profile has two scales. Games are played in rounds;
 * after each round the duel stops as soon as the result is clear — a
 * stricter 99 % interval while peeking, since looking several times would
 * otherwise flatter chance — at the latest after `max` games a seat, and in
 * any case once `seconds` have passed: the time budget holds whatever the
 * machine, and the interval printed says what that time bought.
 *
 * - `quick`: to sort ideas, 5 minutes at most;
 * - `long`: to decide a new version, 20 minutes at most.
 */
export const PROFILES = Object.freeze({
  quick: Object.freeze({ seconds: 300, fast: { min: 1000, max: 4000, chunk: 250 }, slow: { min: 30, max: 100, chunk: 1 } }),
  long: Object.freeze({ seconds: 1200, fast: { min: 4000, max: 12000, chunk: 500 }, slow: { min: 150, max: 400, chunk: 2 } }),
});

/** Engines that search at every move: seconds a game instead of milliseconds. */
export const isSlowEngine = (engine) => /^(lookahead|experimental)/.test(engine);

const PEEK_Z = 2.576;
const FINAL_Z = 1.96;

/**
 * `{ stop, low, high }` after `games` games a seat, `wins` won out of
 * `2 × games`: stop once `min` is played and the interval misses 50 %, or at
 * `max`. The interval returned is the one to report (95 % once stopped).
 */
export function duelVerdict({ wins, games, min, max, outOfTime = false }) {
  const total = 2 * games;
  const [low, high] = wilson(wins, total, PEEK_Z);
  const clear = games >= min && (low > 0.5 || high < 0.5);
  const stop = clear || games >= max || outOfTime;
  const [low95, high95] = wilson(wins, total, FINAL_Z);
  return { stop, clear, low: stop ? low95 : low, high: stop ? high95 : high };
}
