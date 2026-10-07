import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createRng } from "../src/core/random.js";
import { FAMILIES } from "../src/sim/traps.js";
import { loadGame, readIndex } from "./lib/game-index.js";
import { applyThreadsOption, runPool, workerCount } from "./lib/pool.js";

/**
 * `npm run traps -- [--minutes 20] [--threads N|max]`: the traps of the
 * endgame (Sami, 07/10, roadmap 1.2; src/sim/traps.js). The kept bot games
 * (duels/) are cut where the pile is empty; each position is solved exactly,
 * and wherever it is won but the favourite of the 1.1's rollout core loses,
 * the error is filed under a family. How many errors to read the frequent
 * ones: about 5 000, for a dozen families at ± 1.5 points each.
 *
 * Writes data/traps.json (the families, their share, how far down the core
 * ranked the winning move) and data/traps-list.json (every trap, with its
 * duel file, game and turn, to make puzzles of them or look at them).
 */
const args = process.argv.slice(2);
const option = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
applyThreadsOption(args);
const minutes = Math.min(110, Number(option("--minutes", 20)) || 20);
// Under the claim rule the pile runs out after move 30.
const TURNS = [31, 32, 33, 34, 35, 36, 37];
const OUT = (name) => fileURLToPath(new URL(`../data/${name}`, import.meta.url));

/** A log cut down to what stateAt needs: workers receive thousands of them. */
const lean = (log) => ({ format: log.format, rules: log.rules, deck: log.deck, turns: log.turns.map(({ turn, player, move, pass, drew }) => ({ turn, player, move, pass, drew })) });

/** The games, each with its endgame turns, shuffled once with a fixed seed: a run cut by time samples every duel, and two runs read the same order. */
async function positions() {
  const items = [];
  for (const row of await readIndex()) {
    const log = await loadGame(row);
    const turns = TURNS.filter((turn) => turn <= log.turns.length);
    if (turns.length) items.push({ ref: { file: row.file, game: row.game }, log: lean(log), turns });
  }
  const rng = createRng(742);
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = rng.int(i + 1);
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)] ?? null;

/** Each family: how many traps, their share, and how far down the core ranked the winning move. */
function familiesOf(traps) {
  return Object.entries(FAMILIES)
    .map(([family, label]) => {
      const mine = traps.filter((trap) => trap.family === family);
      return { family, label, count: mine.length, share: traps.length ? mine.length / traps.length : 0, medianWinRank: median(mine.map((trap) => trap.winRank)) };
    })
    .sort((a, b) => b.count - a.count);
}

const started = Date.now();
const items = await positions();
// Small tasks (a few hundred games), all against one deadline: no message is too big to send.
const until = Date.now() + minutes * 60_000;
const tasks = [];
for (let i = 0; i < items.length; i += 200) tasks.push({ items: items.slice(i, i + 200), until });
const results = (await runPool(new URL("./lib/trap-worker.js", import.meta.url), tasks, { shouldStop: () => Date.now() > until })).filter(Boolean);
const examined = results.reduce((sum, r) => sum + r.examined, 0);
const won = results.reduce((sum, r) => sum + r.won, 0);
const tooDeep = results.reduce((sum, r) => sum + r.tooDeep, 0);
const traps = results.flatMap((r) => r.traps);
const families = familiesOf(traps);
const summary = { built: new Date().toISOString(), core: "stfig6 (simulations du 1.1)", minutes: +((Date.now() - started) / 60000).toFixed(1), positions: items.reduce((sum, item) => sum + item.turns.length, 0), examined, tooDeep, won, traps: traps.length, errorRate: won ? traps.length / won : 0 };
await writeFile(OUT("traps.json"), `${JSON.stringify({ note: "npm run traps : les fins de partie gagnées où le favori du cœur perd, par famille.", summary, families }, null, 1)}\n`);
await writeFile(OUT("traps-list.json"), `${JSON.stringify(traps)}\n`);

const pct = (x) => `${(100 * x).toFixed(1).replace(".", ",")} %`;
console.log(`${examined} fins de partie examinées sur ${summary.positions}, sur ${workerCount()} fils (${summary.minutes} min), ${tooDeep} trop profondes laissées de côté ; ${won} gagnées pour le joueur au trait ; le cœur s'y trompe ${traps.length} fois (${pct(summary.errorRate)})`);
for (const f of families) console.log(`  ${String(f.count).padStart(6)}  ${pct(f.share).padStart(7)}  ${f.label} (coup gagnant au rang ${f.medianWinRank ?? "—"} du cœur, en médiane)`);
console.log("→ data/traps.json, data/traps-list.json");
