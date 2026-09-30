import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { OFFICIAL_RULES } from "../src/config/rules.js";
import { createRng } from "../src/core/random.js";
import { rulesOf } from "../src/replay/log.js";
import { createGame } from "../src/sim/game.js";
import { bookReader, canonicalKey, encodeBook } from "../src/sim/openings.js";
import { runPool } from "./lib/pool.js";

/**
 * `npm run openings [-- minutes budget]`: a first opening repertoire, the
 * first move of the player who starts, searched deep (2000 rollouts by
 * default) on seeded deals, into data/openings/book.bin (ignored by git,
 * capped at 500 MB). Prints what it cost and what it would cost to cover
 * every opening: the time, not the size, is the limit. 20 minutes at most.
 */
const [minutesArg, budgetArg] = process.argv.slice(2).map(Number);
const minutes = Math.min(20, minutesArg || 15);
const budget = budgetArg || 2000;
const CAP_BYTES = 500 * 1024 * 1024;
const CANONICAL_FIRST_MOVES = 191_000;
const started = Date.now();
const until = started + minutes * 60 * 1000;
const tasks = Array.from({ length: 20_000 }, (_, i) => ({ seed: 50_001 + i, budget, until }));
const results = (await runPool(new URL("./lib/openings-worker.js", import.meta.url), tasks)).filter(Boolean);
const unique = new Map(results.map((entry) => [entry.key, entry]));
const bytes = encodeBook([...unique.values()]);
if (bytes.length > CAP_BYTES) throw new Error("Répertoire au-delà de 500 Mo");
const dir = fileURLToPath(new URL("../data/openings/", import.meta.url));
await mkdir(dir, { recursive: true });
await writeFile(`${dir}book.bin`, bytes);

// Lookup time: every stored key found again, from a real position each time.
const book = bookReader(bytes);
const { spec, order, jokerRule, endMode } = rulesOf(OFFICIAL_RULES);
const probes = Array.from({ length: 2000 }, (_, i) => createGame(spec, { order, jokerRule, endMode, rng: createRng(50_001 + (i % results.length)) }));
const lookupStarted = performance.now();
const hits = probes.filter((state) => book.lookup(canonicalKey(state).key) !== null).length;
const lookupMs = (performance.now() - lookupStarted) / probes.length;
const perPosition = results.reduce((sum, entry) => sum + entry.ms, 0) / results.length / 1000;
const differs = results.filter((entry) => !entry.same).length / results.length;
const hoursForAll = (CANONICAL_FIRST_MOVES * perPosition) / 23 / 3600;
console.log(`# Répertoire d'ouvertures — 1er coup, ${budget} simulations\n`);
console.log(`- ${results.length} positions cherchées, ${results.length - unique.size} doublons de couleurs, ${unique.size} entrées, ${(bytes.length / 1024).toFixed(0)} Ko`);
console.log(`- ${perPosition.toFixed(1)} s par position (un fil) ; tout le 1er coup (~${CANONICAL_FIRST_MOVES.toLocaleString("fr-FR")} ouvertures) : ~${hoursForAll.toFixed(0)} h sur 23 fils, ~${((CANONICAL_FIRST_MOVES * 12) / 1024 / 1024).toFixed(1)} Mo`);
console.log(`- Lecture : ${(lookupMs * 1000).toFixed(0)} µs par coup, clé canonique comprise (${hits} / ${probes.length} retrouvés)`);
console.log(`- Le coup du répertoire diffère du coup joué en direct (400 simulations) dans ${(100 * differs).toFixed(1)} % des ouvertures`);
console.log(`\nDurée : ${((Date.now() - started) / 60000).toFixed(1)} min`);
