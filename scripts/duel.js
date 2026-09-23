import { BOT_IDS, botTag, engineOf } from "../src/config/bots.js";
import { DUEL_ROW, SEED } from "../src/config/simulations.js";
import { wilson } from "../src/irl/analysis.js";
import { runPool } from "./lib/pool.js";

/**
 * `npm run duel -- <bot A> <bot B> [games per seat]`: A against B on the
 * recommended rules, from both seats, on every core. Prints A's win rate with
 * its 95 % interval. Bots are line-up ids (`src/config/bots.js`).
 *
 *   npm run duel -- experimental stratege 2000
 */
const [a = "experimental", b = "stratege", perSeatArg = "1000"] = process.argv.slice(2);
const perSeat = Number(perSeatArg);
if (!BOT_IDS.includes(a) || !BOT_IDS.includes(b) || !Number.isInteger(perSeat) || perSeat <= 0) {
  process.stderr.write(`Usage : npm run duel -- <${BOT_IDS.join("|")}> <${BOT_IDS.join("|")}> [parties par place]\n`);
  process.exit(1);
}

const CHUNK = 100;
const tasks = [];
for (const players of [[engineOf(a), engineOf(b)], [engineOf(b), engineOf(a)]]) {
  for (let played = 0; played < perSeat; played += CHUNK) {
    tasks.push({ ...DUEL_ROW, players, games: Math.min(CHUNK, perSeat - played), seed: SEED + 104729 * (tasks.length + 1) });
  }
}

const started = Date.now();
const results = await runPool(new URL("./lib/sim-worker.js", import.meta.url), tasks);
const half = tasks.length / 2;
const winsAsFirst = results.slice(0, half).reduce((sum, tally) => sum + tally.wins[0], 0);
const winsAsSecond = results.slice(half).reduce((sum, tally) => sum + tally.wins[1], 0);
const games = 2 * perSeat;
const wins = winsAsFirst + winsAsSecond;
const [low, high] = wilson(wins, games);
function verdict(lowBound, highBound) {
  if (lowBound > 0.5) return `  → ${a} est nettement meilleur.`;
  if (highBound < 0.5) return `  → ${b} est nettement meilleur.`;
  return "  → pas de différence nette.";
}

const pct = (share) => `${(100 * share).toFixed(1).replace(".", ",")} %`;

process.stdout.write(
  [
    `${botTag(a)} contre ${botTag(b)} — ${games} parties (${perSeat} de chaque côté), ${((Date.now() - started) / 1000).toFixed(1)} s`,
    `  ${a} gagne ${pct(wins / games)}  (fourchette à 95 % : ${pct(low)} – ${pct(high)})`,
    `  en commençant : ${pct(winsAsFirst / perSeat)} · en second : ${pct(winsAsSecond / perSeat)}`,
    verdict(low, high),
    "",
  ].join("\n"),
);
