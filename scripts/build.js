import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { SAMPLE_SIZES, SEED } from "../src/config/simulations.js";
import {
  assembleSimulations,
  computeExact,
  computeOuts,
  computeStartingHands,
  simulationTasks,
} from "../src/report/data.js";
import { runPool } from "./lib/pool.js";

/**
 * `npm run build`: every number of every report, from scratch.
 * `--quick` shrinks the samples for iterating on the report layout.
 */
const quick = process.argv.includes("--quick");
const sizes = quick ? SAMPLE_SIZES.quick : SAMPLE_SIZES.full;
const outDir = fileURLToPath(new URL("../out/", import.meta.url));
const started = Date.now();
const elapsed = () => `${((Date.now() - started) / 1000).toFixed(1)} s`;

const log = (message) => process.stdout.write(`${message}\n`);

log(`Build ${quick ? "rapide" : "complet"} — graine ${SEED}`);
const exact = computeExact();
log(`  mains de 3 cartes : énumération exacte (${elapsed()})`);
const outs = computeOuts();
const startingHands = computeStartingHands(sizes.startingHands);
log(`  mains de départ : ${sizes.startingHands} tirages par paquet (${elapsed()})`);

const tasks = simulationTasks(sizes);
const results = await runPool(new URL("./lib/sim-worker.js", import.meta.url), tasks, {
  onProgress: (done, total) => {
    if (done % 25 === 0 || done === total) log(`  parties : ${done}/${total} lots (${elapsed()})`);
  },
});
const simulations = assembleSimulations(tasks, results);

const data = {
  generatedAt: new Date().toISOString(),
  seed: SEED,
  quick,
  sizes,
  exact,
  outs,
  startingHands,
  simulations,
};

mkdirSync(outDir, { recursive: true });
writeFileSync(new URL("data.json", `file://${outDir.replaceAll("\\", "/")}/`), JSON.stringify(data, null, 1));
log(`Terminé en ${elapsed()} → out/data.json`);
