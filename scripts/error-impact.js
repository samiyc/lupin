import { readIndex, startTurn } from "./lib/game-index.js";
import { runPool } from "./lib/pool.js";

/**
 * `npm run error-impact -- [--player experimental@0.9.0] [--games 60]`: at
 * which turn does an error cost the most? (Sami, evol-exp-090)
 *
 * On kept games where both seats are that player and both starting hands are
 * medium (duels/), a random legal move other than the one played is forced on
 * the player to move at turn T; the same bots play on to turn 30, and the
 * exact solver says who holds the game then. The control plays on from the
 * same position with no error, only the bots' seed changed (`reseed`): early
 * in a game any change reshuffles what follows, and comparing with the kept
 * game would measure that chaos, not the error. The impact at T is how much
 * less often the player who erred holds the game than in the control, game by
 * game.
 *
 * T runs over every fourth turn, plus two turning points: the move that puts a
 * player on all seven borders, and the move that wins the first border.
 */
const args = process.argv.slice(2);
const player = args.includes("--player") ? args[args.indexOf("--player") + 1] : "experimental@0.9.0";
const games = Number(args.includes("--games") ? args[args.indexOf("--games") + 1] : 30);
const TURNS = [2, 6, 10, 14, 18, 22, 26, 29];
const started = Date.now();

const rows = (await readIndex()).filter(
  (row) => row.players.every((name) => name === player) && row.handClasses.every((kind) => kind === "medium") && !row.advantage.ended && Number.isInteger(row.advantage.value),
);
const series = [...TURNS.map((turn) => ({ label: `tour ${turn}`, from: String(turn) })), { label: "7 bornes entamées", from: "columns" }, { label: "1re borne gagnée", from: "first-border" }];
const tasks = [];
for (const { label, from } of series) {
  rows
    .map((row) => ({ row, turn: startTurn(row, from) }))
    .filter(({ turn }) => turn !== null && turn >= 1 && turn <= 30)
    .slice(0, games)
    .forEach(({ row, turn }) => {
      tasks.push({ label, row, turn, force: "random" });
      tasks.push({ label, row, turn, reseed: 1, control: true });
    });
}
const results = await runPool(new URL("./lib/branch-worker.js", import.meta.url), tasks);

const pct = (share) => `${(100 * share).toFixed(1).replace(".", ",")} %`;
console.log(`# Le prix d'une erreur, tour par tour — ${player} contre lui-même, mains moyennes, ${rows.length} parties gardées\n`);
console.log("| Erreur au tour | Parties | Le fautif tient la partie au tour 30 : témoin sans erreur | avec l'erreur | Impact (± 95 %) |");
console.log("| --- | --- | --- | --- | --- |");
const holds = tasks.map((task, i) => ({ ...task, holder: results[i].holder }));
// The player to move before move T is the one who erred: seat 0 moves first.
const mover = ({ turn }) => (turn - 1) % 2;
for (const { label } of series) {
  const errors = holds.filter((task) => task.label === label && !task.control);
  const controls = holds.filter((task) => task.label === label && task.control);
  // Game by game: 1 when the control holds and the error does not, -1 the other way.
  const diffs = errors.map((task, i) => Number(controls[i].holder === mover(task)) - Number(task.holder === mover(task)));
  const mean = diffs.reduce((a, b) => a + b, 0) / Math.max(1, diffs.length);
  const sd = Math.sqrt(diffs.reduce((sum, d) => sum + (d - mean) ** 2, 0) / Math.max(1, diffs.length - 1));
  const share = (list) => list.filter((task) => task.holder === mover(task)).length / Math.max(1, list.length);
  console.log(`| ${label} | ${diffs.length} | ${pct(share(controls))} | ${pct(share(errors))} | ${pct(mean)} ± ${pct((1.96 * sd) / Math.sqrt(Math.max(1, diffs.length)))} |`);
}
console.log(`\nDurée : ${((Date.now() - started) / 60000).toFixed(1)} min`);
