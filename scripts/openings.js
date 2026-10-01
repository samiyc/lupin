import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { OFFICIAL_RULES } from "../src/config/rules.js";
import { DUEL_ROW, SEED } from "../src/config/simulations.js";
import { buildDeck } from "../src/core/cards.js";
import { createRng } from "../src/core/random.js";
import { rulesOf } from "../src/replay/log.js";
import { createGame, legalMoves } from "../src/sim/game.js";
import { bookReader, canonicalKey, encodeBook, fromCanonical } from "../src/sim/openings.js";
import { runPool } from "./lib/pool.js";

/**
 * `npm run openings -- [--minutes N] [--offset K] [--budget B]`: one lot of
 * the opening repertoire, fed by the games the 0.8 loses.
 *
 * 1. The 0.8 (`ismcts@800`) starts against the Stratège for N minutes (20 at
 *    most), at the page's rule, on decks derived from K: a weaker bot, whose
 *    wins point at real mistakes rather than at self-play noise.
 * 2. The first move of every game it lost is searched at B iterations (5000)
 *    by its own tree: only the starter's opening can be computed ahead, the
 *    second player's depends on the card the first one laid.
 * 3. The entries join data/openings/entries.json (keys in clear, to merge
 *    lots) and data/openings/book.bin (what a bot reads), both ignored by git.
 * 4. The coverage: on 10 000 fresh deals, the share whose first move the
 *    book holds — how often a game would ever use it.
 */
const args = process.argv.slice(2);
const valueOf = (flag, fallback) => (args.includes(flag) ? Number(args[args.indexOf(flag) + 1]) : fallback);
const minutes = Math.min(20, valueOf("--minutes", 20));
const offset = valueOf("--offset", 0);
const budget = valueOf("--budget", 5000);
const threads = Math.max(2, os.cpus().length - 1);
const dir = fileURLToPath(new URL("../data/openings/", import.meta.url));
const { spec, order, jokerRule, endMode } = rulesOf(OFFICIAL_RULES);
const base = SEED + 1_000_003 * (offset + 100);
const deckOf = (deals, g) => createRng(deals + 7919 * g).shuffle(buildDeck(spec));
const started = Date.now();
const elapsed = () => `${((Date.now() - started) / 60000).toFixed(1)} min`;

/** Phase 1: rounds of games, the 0.8 first, until the time is up; the decks it lost. */
async function lostDecks() {
  const lost = [];
  let [games, round] = [0, 0];
  while (Date.now() - started < minutes * 60_000 * 0.85) {
    const tasks = Array.from({ length: threads }, (_, t) => {
      const index = round * threads + t;
      return { ...DUEL_ROW, endMode: OFFICIAL_RULES.endMode, keepWinners: true, players: ["ismcts@800", "lookahead"], games: 2, seed: base + 104_729 * index, deals: base + 7 * 104_729 * index };
    });
    const results = await runPool(new URL("./lib/sim-worker.js", import.meta.url), tasks);
    results.forEach(({ winners }, t) => winners.forEach((winner, g) => winner === 1 && lost.push(deckOf(tasks[t].deals, g))));
    games += tasks.length * 2;
    round += 1;
    process.stderr.write(`  ${games} parties, ${lost.length} perdues par le 0.8, ${elapsed()}\n`);
  }
  return { games, lost };
}

/** The entries already computed, keyed in clear. */
async function readEntries() {
  try {
    return new Map(JSON.parse(await readFile(`${dir}entries.json`, "utf8")).map((entry) => [entry.key, entry]));
  } catch {
    return new Map();
  }
}

/** The 0.7's first book (no entries.json beside it) is kept aside, not merged: another engine, another budget. */
async function setOldBookAside(entries) {
  if (entries.size > 0) return;
  await rename(`${dir}book.bin`, `${dir}book-0.7.bin`).catch(() => {});
}

/** Every entry found again, and its move legal where it came from. */
function check(book, computed) {
  return computed.every(({ deck }) => {
    const state = createGame(spec, { order, jokerRule, endMode, deck, rng: null });
    const { key, symmetry } = canonicalKey(state);
    const stored = book.lookup(key);
    const move = stored && fromCanonical(spec, stored, symmetry);
    return move && legalMoves(state).some((legal) => legal.card === move.card && legal.border === move.border);
  });
}

function coverage(book) {
  const probes = 10_000;
  let hits = 0;
  for (let i = 0; i < probes; i += 1) {
    const state = createGame(spec, { order, jokerRule, endMode, rng: createRng(9_000_001 + i) });
    if (book.lookup(canonicalKey(state).key)) hits += 1;
  }
  return hits / probes;
}

const { games, lost } = await lostDecks();
const until = started + (minutes + 15) * 60_000;
const tasks = lost.map((deck, i) => ({ deck, seed: base + i, budget, until }));
const done = (await runPool(new URL("./lib/openings-worker.js", import.meta.url), tasks)).map((entry, i) => entry && { ...entry, deck: lost[i] }).filter(Boolean);
await mkdir(dir, { recursive: true });
const entries = await readEntries();
await setOldBookAside(entries);
const before = entries.size;
for (const { key, move, visits } of done) entries.set(key, { key, move, visits });
const bytes = encodeBook([...entries.values()]);
await writeFile(`${dir}entries.json`, JSON.stringify([...entries.values()]));
await writeFile(`${dir}book.bin`, bytes);
const book = bookReader(bytes);
const pct = (share) => `${(100 * share).toFixed(2).replace(".", ",")} %`;
const perEntry = done.reduce((sum, entry) => sum + entry.ms, 0) / Math.max(1, done.length) / 1000;
const differs = done.filter((entry) => !entry.same).length / Math.max(1, done.length);
console.log(`# Répertoire d'ouvertures — lot ${offset}, ${budget} itérations par ouverture\n`);
console.log(`- ${games} parties, le 0.8 commence contre le Stratège : ${lost.length} perdues (${pct(lost.length / games)})`);
console.log(`- ${done.length} ouvertures cherchées, ${perEntry.toFixed(1)} s chacune sur un fil ; le coup profond diffère du coup à 800 dans ${pct(differs)}`);
console.log(`- Livre : ${before} → ${entries.size} entrées, ${(bytes.length / 1024).toFixed(0)} Ko ; relues et légales : ${check(book, done) ? "oui" : "NON"}`);
console.log(`- Recouvrement : ${pct(coverage(book))} des donnes neuves ont leur 1er coup dans le livre`);
console.log(`\nDurée : ${elapsed()}`);
