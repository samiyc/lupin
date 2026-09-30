import os from "node:os";
import { BOT_IDS, BOT_LINEUP, botTag, engineOf } from "../src/config/bots.js";
import { DUEL_ROW, SEED } from "../src/config/simulations.js";
import { BOTS, engineFor } from "../src/sim/bots.js";
import { PROFILES, duelVerdict, isSlowEngine } from "./lib/duel-plan.js";
import { runPool } from "./lib/pool.js";

/**
 * `npm run duel -- <bot A> <bot B> [--quick | --long] [--games N]`: A against
 * B on the recommended rules, from both seats, on every core. Prints A's win
 * rate with its 95 % interval, round after round, and stops as soon as the
 * result is clear (`scripts/lib/duel-plan.js`). `--quick` (the default) sorts
 * ideas in 5 minutes at most; `--long` decides a version in 20 at most;
 * `--games N` plays exactly N games a seat, however long it takes.
 *
 * Bots are line-up ids (`src/config/bots.js`) or engine ids (`BOTS` in
 * `src/sim/bots.js`, and `experimental:N` for N rollouts a move).
 *
 *   npm run duel -- idea:middle strategist
 *   npm run duel -- experimental:400 stratege --long
 */
const args = process.argv.slice(2);
const [a = "experimental", b = "stratege"] = args.filter((arg) => !arg.startsWith("--") && !/^\d+$/.test(arg));
const exact = Number(args[args.indexOf("--games") + 1]) || Number(args.find((arg) => /^\d+$/.test(arg))) || null;
const profile = PROFILES[args.includes("--long") ? "long" : "quick"];

const engine = (id) => (id in BOT_LINEUP ? engineOf(id) : id);
const tag = (id) => (id in BOT_LINEUP ? botTag(id) : id);
const known = (id) => {
  try {
    return Boolean(engineFor(engine(id)));
  } catch {
    return false;
  }
};
if (!known(a) || !known(b)) {
  process.stderr.write(`Usage : npm run duel -- <robot> <robot> [--quick | --long] [--games N]\n  robots : ${BOT_IDS.join(", ")}, ${Object.keys(BOTS).join(", ")}, experimental:N\n`);
  process.exit(1);
}

const slow = isSlowEngine(engine(a)) || isSlowEngine(engine(b));
const scale = slow ? profile.slow : profile.fast;
const plan = exact ? { min: exact, max: exact, chunk: Math.max(1, Math.ceil(exact / 20)) } : scale;
const threads = Math.max(2, os.cpus().length - 1);
const pct = (share) => `${(100 * share).toFixed(1).replace(".", ",")} %`;

const tally = { games: 0, first: 0, second: 0, tasks: 0 };
const started = Date.now();
let verdict = { stop: false };
let lastRound = 0;
while (!verdict.stop) {
  const roundStarted = Date.now();
  const perSeat = Math.min(plan.max - tally.games, Math.max(plan.chunk, Math.ceil(threads / 2) * plan.chunk));
  const tasksPerSeat = Math.ceil(perSeat / plan.chunk);
  const tasks = [];
  // Both seatings play the same decks (`deals`): the luck of the cards cancels out.
  const round = tally.tasks;
  for (const players of [[engine(a), engine(b)], [engine(b), engine(a)]]) {
    for (let t = 0; t < tasksPerSeat; t += 1) {
      tally.tasks += 1;
      tasks.push({ ...DUEL_ROW, players, games: Math.min(plan.chunk, perSeat - t * plan.chunk), seed: SEED + 104729 * tally.tasks, deals: SEED + 7 * 104729 * (round + t) });
    }
  }
  const results = await runPool(new URL("./lib/sim-worker.js", import.meta.url), tasks);
  results.forEach((result, i) => {
    if (i < tasksPerSeat) tally.first += result.wins[0];
    else tally.second += result.wins[1];
  });
  tally.games += perSeat;
  lastRound = Date.now() - roundStarted;
  // Stop when another round like the last one would not fit: the cap holds, rounds are minutes long.
  const outOfTime = !exact && Date.now() - started + lastRound > profile.seconds * 1000;
  verdict = duelVerdict({ wins: tally.first + tally.second, games: tally.games, min: plan.min, max: plan.max, outOfTime });
  const seconds = ((Date.now() - started) / 1000).toFixed(0);
  process.stderr.write(`  ${2 * tally.games} parties, ${a} ${pct((tally.first + tally.second) / (2 * tally.games))} (${pct(verdict.low)} – ${pct(verdict.high)}), ${seconds} s\n`);
}

const share = (tally.first + tally.second) / (2 * tally.games);
function conclusion() {
  if (verdict.low > 0.5) return `  → ${a} est nettement meilleur.`;
  if (verdict.high < 0.5) return `  → ${b} est nettement meilleur.`;
  return "  → pas de différence nette.";
}
process.stdout.write(
  [
    `${tag(a)} contre ${tag(b)} — ${2 * tally.games} parties (${tally.games} de chaque côté), ${((Date.now() - started) / 1000).toFixed(1)} s`,
    `  ${a} gagne ${pct(share)}  (fourchette à 95 % : ${pct(verdict.low)} – ${pct(verdict.high)})`,
    `  en commençant : ${pct(tally.first / tally.games)} · en second : ${pct(tally.second / tally.games)}`,
    conclusion(),
    "",
  ].join("\n"),
);
