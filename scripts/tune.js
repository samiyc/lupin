import { writeFile } from "node:fs/promises";
import os from "node:os";
import { createRng } from "../src/core/random.js";
import { TUNED } from "../src/sim/tuning.js";
import { runPool } from "./lib/pool.js";

/**
 * `npm run tune -- [--minutes N]`: tunes the rollout core's weights
 * (src/sim/tuning.js) by self-play, with SPSA. Each round, every thread
 * probes one random direction: the core nudged one way against the core
 * nudged the other way, on the same decks from both seats. The weights move
 * along the directions that won, by steps that shrink with the rounds. The
 * mean of the second half of the run (less noisy than its last point) goes to
 * src/sim/tuned-core.js, for `npm run duel -- core:tuned core`.
 * 15 minutes by default, 20 at most.
 */
const args = process.argv.slice(2);
const minutes = Math.min(20, Number(args[args.indexOf("--minutes") + 1]) || 15);
const GAMES = 60;
const [A0, C0, STABILITY, LIMIT] = [30, 1, 10, 8];
const threads = Math.max(2, os.cpus().length - 1);
const rng = createRng(742);
const worker = new URL("./lib/tune-worker.js", import.meta.url);
const target = new URL("../src/sim/tuned-core.js", import.meta.url);

/** Weights in steps away from today's (0 = today), to real values. */
const weightsOf = (units) => Object.fromEntries(TUNED.map(({ key, start, step }, i) => [key, start + step * units[i]]));
const clampUnits = (units) => units.map((u) => Math.max(-LIMIT, Math.min(LIMIT, u)));

/** One round: a probe per thread, and the mean gradient estimate. */
async function round(units, t) {
  const c = C0 / (t + 1) ** 0.101;
  const deltas = Array.from({ length: threads }, () => TUNED.map(() => (rng.next() < 0.5 ? -1 : 1)));
  const tasks = deltas.map((delta, k) => ({
    plus: weightsOf(units.map((u, i) => u + c * delta[i])),
    minus: weightsOf(units.map((u, i) => u - c * delta[i])),
    games: GAMES,
    deals: 1_000_003 * (t + 1) + 7_919 * k,
    seed: 104_729 * (t + 1) + k,
  }));
  const points = await runPool(worker, tasks);
  const margins = points.map((p) => p / (2 * GAMES) - 0.5);
  const gradient = TUNED.map((_, i) => margins.reduce((sum, d, k) => sum + (d / (2 * c)) * deltas[k][i], 0) / threads);
  return { gradient, margin: margins.reduce((sum, d) => sum + Math.abs(d), 0) / threads };
}

const started = Date.now();
let units = TUNED.map(() => 0);
const history = [];
const fmt = (x) => x.toFixed(3);
console.log(`# Réglage du cœur par auto-jeu (SPSA) — ${threads} sondes par manche, ${2 * GAMES} parties chacune, ${minutes} min\n`);
console.log(`| Manche | min | écart moyen | ${TUNED.map(({ key }) => key).join(" | ")} |`);
console.log(`| --- | --- | --- | ${TUNED.map(() => "---").join(" | ")} |`);
while (Date.now() - started < minutes * 60_000) {
  const t = history.length;
  const { gradient, margin } = await round(units, t);
  const a = A0 / (t + 1 + STABILITY) ** 0.602;
  units = clampUnits(units.map((u, i) => u + a * gradient[i]));
  history.push(units);
  if (t % 20 === 0) {
    const weights = weightsOf(units);
    console.log(`| ${t} | ${((Date.now() - started) / 60_000).toFixed(1)} | ${fmt(margin)} | ${TUNED.map(({ key }) => fmt(weights[key])).join(" | ")} |`);
  }
}
const half = history.slice(Math.floor(history.length / 2));
const mean = TUNED.map((_, i) => half.reduce((sum, u) => sum + u[i], 0) / half.length);
const tuned = weightsOf(mean);
console.log(`\n${history.length} manches. Moyenne de la seconde moitié :\n`);
console.log("| Poids | Aujourd'hui | Réglé |");
console.log("| --- | --- | --- |");
for (const { key, start } of TUNED) console.log(`| ${key} | ${fmt(start)} | ${fmt(tuned[key])} |`);
const entries = TUNED.map(({ key }) => `${key}: ${Number(tuned[key].toFixed(4))}`).join(", ");
const stamp = `${new Date().toISOString().slice(0, 10)}, ${history.length} rounds of ${threads} probes`;
await writeFile(target, `/** Written by \`npm run tune\` (${stamp}): the core's weights after self-play tuning (tuning.js). */\nexport const TUNED_CORE = Object.freeze({ ${entries} });\n`);
console.log(`\nDurée : ${((Date.now() - started) / 60_000).toFixed(1)} min → src/sim/tuned-core.js`);
