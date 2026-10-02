import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { ORACLE } from "../src/replay/oracle.js";
import { readIndex } from "./lib/game-index.js";
import { runPool } from "./lib/pool.js";

/**
 * `npm run oracle -- [--minutes 240] [--games N] [--budget 20000] [--turns 15,16,20,21,25,26 | --at last-column] [--all] [--hands medium]`:
 * the oracle on the kept games (Sami, 03/10; src/replay/oracle.js). Each
 * position — the turns given, by default 15-16, 20-21 and 25-26, so both
 * players — gets the core's ranking and two oracle searches over every legal
 * move; a gap is the oracle's move, the same in both runs, outside the core's
 * top 3.
 *
 * With `--at last-column`, the positions are instead, for each player, the
 * move that put its first card on its last empty border (`columns` in the
 * index, src/replay/game-analysis.js): does the oracle open it too, or play
 * elsewhere? (Sami, 03/10.)
 *
 * Positions come from the 0.9's games against itself in duels/, then with
 * `--all` from every game between bots of equal strength. Each result is
 * appended to oracle/positions.jsonl as it lands, and a new run skips the
 * positions already there: a run cut short loses nothing. `--minutes` stops
 * taking new positions after that long. The gaps and the rates by turn and
 * by player go to data/oracle-diffs.json; `--summary` rebuilds it alone.
 */
const args = process.argv.slice(2);
const option = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
const minutes = Number(option("--minutes", Infinity));
const budget = Number(option("--budget", ORACLE.budget));
const turns = option("--turns", ORACLE.turns.join(",")).split(",").map(Number);
const games = Number(option("--games", Infinity));
const hands = option("--hands", null);
const at = option("--at", null);
const ROOT = new URL("../", import.meta.url);
const OUT = new URL("oracle/positions.jsonl", ROOT);
const WEAK_BOTS = /^(basique|stratege)@/;
const SELF = "experimental@0.9.0";

async function readPositions() {
  const text = await readFile(OUT, "utf8").catch(() => "");
  return text.split("\n").filter(Boolean).map((line) => JSON.parse(line));
}

/** The games to read: the 0.9 against itself first, then (`--all`) every other game between equals. */
async function rowsToRead() {
  const rows = (await readIndex()).filter((row) => !row.players.some((player) => WEAK_BOTS.test(player)));
  const self = rows.filter((row) => row.players.every((player) => player === SELF));
  const others = args.includes("--all") ? rows.filter((row) => !self.includes(row)) : [];
  return [...self, ...others].filter((row) => !hands || row.handClasses.every((kind) => kind === hands)).slice(0, games);
}

const pct = (x) => `${(100 * x).toFixed(1).replace(".", ",")} %`;

/** Rates by group: positions, stable, gaps (outside the top 3), unseen (outside the top 8). */
function rates(positions, groupOf) {
  const groups = new Map();
  for (const position of positions.filter((entry) => !entry.skipped)) {
    const group = groups.get(groupOf(position)) ?? { positions: 0, stable: 0, gaps: 0, unseen: 0 };
    group.positions += 1;
    group.stable += position.stable ? 1 : 0;
    group.gaps += position.gap ? 1 : 0;
    group.unseen += position.unseen ? 1 : 0;
    groups.set(groupOf(position), group);
  }
  return Object.fromEntries([...groups].sort(([a], [b]) => String(a).localeCompare(String(b), "fr", { numeric: true })));
}

function printRates(title, table) {
  console.log(title);
  for (const [name, g] of Object.entries(table)) console.log(`  ${String(name).padEnd(14)} ${String(g.positions).padStart(5)} positions, stables ${pct(g.stable / g.positions)}, écarts hors top 3 ${pct(g.gaps / g.positions)}, hors top 8 ${pct(g.unseen / g.positions)}`);
}

/** On the move onto the last empty border: how often the oracle plays elsewhere, and how often it disagrees with the 0.9. */
function reportLastColumn(entries) {
  const share = (test) => pct(entries.filter(test).length / entries.length);
  console.log(`Au coup qui remplit la dernière colonne vide : ${entries.length} positions`);
  console.log(`  l'oracle ouvre aussi une colonne vide : ${share((entry) => entry.opens.oracle)} ; il joue ailleurs : ${share((entry) => !entry.opens.oracle)}`);
  console.log(`  l'oracle joue le coup du 0.9 : ${share((entry) => entry.move === entry.played)} ; écart stable hors du top 3 du cœur : ${share((entry) => entry.gap)}`);
}

async function summarize() {
  const positions = await readPositions();
  const byTurn = rates(positions, (entry) => `tour ${entry.turn}`);
  const byPlayer = rates(positions, (entry) => (entry.starter ? "a commencé" : "second"));
  const lastColumn = positions.filter((entry) => entry.at === "last-column" && !entry.skipped);
  if (lastColumn.length > 0) reportLastColumn(lastColumn);
  const gaps = positions.filter((entry) => entry.gap);
  printRates(`${positions.length} positions lues, ${gaps.length} écarts stables hors du top 3 du cœur`, byTurn);
  printRates("Par joueur", byPlayer);
  const summary = { built: new Date().toISOString().slice(0, 10), engine: ORACLE.engine, budget, positions: positions.length, byTurn, byPlayer, gaps };
  await writeFile(new URL("data/oracle-diffs.json", ROOT), `${JSON.stringify(summary, null, 1)}\n`);
}

/** The positions of a game to read: the fixed turns, or each player's move onto its last empty border. */
function turnsOf(row) {
  if (at === "last-column") return (row.columns ?? []).filter((turn) => Number.isInteger(turn) && turn > 0);
  return turns.filter((turn) => turn <= row.turns);
}

async function hunt() {
  await mkdir(new URL("oracle/", ROOT), { recursive: true });
  const done = new Set((await readPositions()).map((entry) => `${entry.key}|${entry.turn}`));
  const tasks = (await rowsToRead())
    .flatMap((row) => turnsOf(row).map((turn) => ({ row: { key: row.key, file: row.file, game: row.game, handClasses: row.handClasses }, turn, budget, at: at ?? "tours fixes" })))
    .filter((task) => !done.has(`${task.row.key}|${task.turn}`));
  const started = Date.now();
  const tally = { done: 0, gaps: 0 };
  const cap = Number.isFinite(minutes) ? `${minutes} min au plus` : "sans limite de temps";
  console.log(`${tasks.length} positions à lire (${done.size} déjà faites), oracle ${ORACLE.engine}@${budget}, ${cap}`);
  await runPool(new URL("./lib/oracle-worker.js", import.meta.url), tasks, {
    shouldStop: () => Date.now() - started > minutes * 60_000,
    onResult: (result) => {
      tally.done += 1;
      tally.gaps += result.gap ? 1 : 0;
      appendFile(OUT, `${JSON.stringify(result)}\n`);
      if (tally.done % 50 === 0) console.log(`  ${tally.done} positions, ${((Date.now() - started) / 1000 / tally.done).toFixed(1)} s par position (sur tous les fils), ${tally.gaps} écarts, ${((Date.now() - started) / 60_000).toFixed(0)} min`);
    },
  });
  console.log(`${tally.done} positions lues en ${((Date.now() - started) / 60_000).toFixed(1)} min.\n`);
}

if (!args.includes("--summary")) await hunt();
await summarize();
