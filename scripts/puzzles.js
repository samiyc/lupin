import { mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { runPool } from "./lib/pool.js";

/**
 * `npm run puzzles -- [--minutes N]`: endgame puzzles from the self-play games
 * (selfplay/, `npm run selfplay`). Once the pile is empty every card is known
 * and `src/sim/endgame.js` solves the end exactly; a puzzle is a position won
 * for the side to move through few of its moves (at most `SHARE` of them),
 * two per game at most. Strong games are rarely delicate at the very end:
 * 4 544 endgames at 30 % gave only 19.
 * The best `COUNT` — fewest solutions, then deepest, then those the fast
 * strategist gets wrong — go to web/data/puzzles.json, where the page reads
 * them. 10 minutes at most.
 */
const SHARE = 0.5;
const COUNT = 50;
const TURNS = [33, 34, 35, 36, 37];
const PER_GAME = 2;
const args = process.argv.slice(2);
const minutes = Math.min(20, Number(args[args.indexOf("--minutes") + 1]) || 10);
const source = fileURLToPath(new URL("../selfplay/experimental_80.json", import.meta.url));
const logs = JSON.parse(await readFile(source, "utf8"));

const started = Date.now();
const items = logs.flatMap((log, index) => TURNS.map((turn) => ({ index, log, turn })));
const threads = Math.max(1, os.cpus().length - 1);
const tasks = Array.from({ length: threads }, (_, t) => ({ items: items.filter((_, i) => i % threads === t), share: SHARE, seconds: minutes * 60 }));
const found = (await runPool(new URL("./lib/puzzle-worker.js", import.meta.url), tasks)).flat();

/** Fewest solutions first, then the deepest, then those the strategist gets wrong. */
function byRichness(a, b) {
  return a.solutions.length - b.solutions.length || b.cardsLeft - a.cardsLeft || Number(a.coreFails === false) - Number(b.coreFails === false);
}
const chosen = [];
for (const puzzle of found.sort(byRichness)) {
  if (chosen.filter((other) => other.index === puzzle.index).length >= PER_GAME) continue;
  chosen.push(puzzle);
  if (chosen.length === COUNT) break;
}
const strip = (log, turn) => ({ format: log.format, rules: log.rules, deck: log.deck, turns: log.turns.slice(0, turn - 1).map(({ turn: t, player, move, pass, drew }) => ({ turn: t, player, move, pass, drew })) });
const puzzles = chosen.map((p, i) => ({ id: i + 1, turn: p.turn, cardsLeft: p.cardsLeft, moves: p.moves, solutions: p.solutions, coreMove: p.coreMove, coreFails: p.coreFails, log: strip(logs[p.index], p.turn) }));
const dir = fileURLToPath(new URL("../web/data/", import.meta.url));
await mkdir(dir, { recursive: true });
// The "gain immédiat" puzzles come from `npm run puzzles:immediate`: kept as they are.
const previous = await readFile(`${dir}puzzles.json`, "utf8").then((text) => JSON.parse(text).puzzles, () => []);
const immediate = previous.filter((puzzle) => puzzle.kind === "immediate");
await writeFile(`${dir}puzzles.json`, `${JSON.stringify({ generatedAt: new Date().toISOString(), puzzles: [...puzzles, ...immediate] })}\n`);
const unique = puzzles.filter((p) => p.solutions.length === 1).length;
process.stdout.write(`${items.length} fins de partie examinées, ${found.length} puzzles possibles, ${puzzles.length} gardés (${unique} à solution unique, ${puzzles.filter((p) => p.coreFails).length} où le Stratège se trompe) — ${((Date.now() - started) / 60000).toFixed(1)} min\n`);
