import { readFile } from "node:fs/promises";
import { runPool } from "./lib/pool.js";

/**
 * `npm run cases -- <engine> [<engine>…]`: each engine on the hard cases of
 * data/hard-cases.json (`npm run hard-cases`) — the share of positions where
 * it plays the move the offline analysis found best, by phase of the game.
 * Three seeds a case. The yardstick of every new version, beside the duel.
 */
const engines = process.argv.slice(2).length > 0 ? process.argv.slice(2) : ["experimental"];
const SEEDS = [1, 2, 3];
const { cases } = JSON.parse(await readFile(new URL("../data/hard-cases.json", import.meta.url), "utf8"));
const pct = (found, tried) => `${((100 * found) / Math.max(1, tried)).toFixed(1).replace(".", ",")} %`;
const started = Date.now();
console.log(`# Cas difficiles — ${cases.length} positions, ${SEEDS.length} graines\n`);
console.log("| Moteur | Tous | Début | Milieu | Fin |");
console.log("| --- | --- | --- | --- | --- |");
for (const engine of engines) {
  const results = await runPool(new URL("./lib/cases-worker.js", import.meta.url), cases.map((hardCase) => ({ hardCase, engine, seeds: SEEDS })));
  const share = (phase) => {
    const rows = results.filter((r) => !phase || r.phase === phase);
    return pct(rows.reduce((s, r) => s + r.found, 0), rows.reduce((s, r) => s + r.tried, 0));
  };
  console.log(`| ${engine} | ${share()} | ${share("début")} | ${share("milieu")} | ${share("fin")} |`);
}
console.log(`\nDurée : ${((Date.now() - started) / 1000).toFixed(0)} s`);
