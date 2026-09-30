import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { runPool } from "./lib/pool.js";

/**
 * `npm run hard-cases [-- minutes]`: the positions where the 0.7 hesitates —
 * its search ends without separating its two best moves — settled offline by
 * a deeper look (`scripts/lib/hard-case-worker.js`). They go to
 * data/hard-cases.json, the yardstick every new version is scored on
 * (`npm run cases`), beside the duel. 20 minutes at most.
 */
const minutes = Math.min(20, Number(process.argv[2]) || 18);
const GAMES = 600;
const settings = { step: 3, playouts: 24, budget: 25, perGame: 2 };
const started = Date.now();
const until = started + minutes * 60 * 1000;
const tasks = Array.from({ length: GAMES }, (_, i) => ({ ...settings, seed: 7001 + i, until }));
const found = (await runPool(new URL("./lib/hard-case-worker.js", import.meta.url), tasks)).flat();
const phase = (turn) => {
  if (turn <= 14) return "début";
  return turn <= 29 ? "milieu" : "fin";
};
const strip = (log, turn) => ({ format: log.format, rules: log.rules, deck: log.deck, turns: log.turns.slice(0, turn - 1).map(({ turn: t, player, move, pass, drew }) => ({ turn: t, player, move, pass, drew })) });
const cases = found.map((c, i) => ({ id: i + 1, phase: phase(c.turn), turn: c.turn, candidates: c.candidates, means: c.means.map((m) => Number(m.toFixed(3))), reference: c.reference, margin: Number(c.margin.toFixed(3)), error: Number(c.error.toFixed(3)), log: strip(c.log, c.turn) }));
const dir = fileURLToPath(new URL("../data/", import.meta.url));
await mkdir(dir, { recursive: true });
await writeFile(`${dir}hard-cases.json`, `${JSON.stringify({ generatedAt: new Date().toISOString(), settings, cases })}\n`);
const count = (name) => cases.filter((c) => c.phase === name).length;
process.stdout.write(`${cases.length} cas difficiles (début ${count("début")}, milieu ${count("milieu")}, fin ${count("fin")}) — ${((Date.now() - started) / 60000).toFixed(1)} min\n`);
