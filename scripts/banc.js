import { readFile, writeFile } from "node:fs/promises";
import { BOT_LINEUP } from "../src/config/bots.js";
import { againstBase, bancVerdict, judge, pairedDiff, rankCorrelation, summarizeBanc } from "../src/replay/banc.js";
import { ORACLE } from "../src/replay/oracle.js";
import { runPool } from "./lib/pool.js";

/**
 * `npm run banc -- [<engine>] [--against <engine>] [--positions banc] [--threads N] [--queue] [--calibrate]`:
 * the similarity bench (Sami, 04/10; src/replay/banc.js). A version of the V1
 * plays one move on each of the bench's positions, and its moves are judged
 * by the oracle's visits there; against the 1.0 (or `--against`) on the same
 * positions, the gap of oracle value comes with its interval over the pairs,
 * and a verdict: « à pousser », « neutre » or « à écarter ». Minutes, where a
 * decision on whole games takes hours.
 *
 * - `--threads 4` leaves the machine usable (about four times slower).
 * - `--queue`: the version's four long duels against the 1.0 go to the
 *   backlog (`--long --page --offset 0..3`, a pause between two): the second
 *   step, the one that decides.
 * - `--calibrate`: every version of data/banc-calibration.json, whose real
 *   duel scores are known — does the bench rank them as the duels do?
 *
 * The reference's moves (the 1.0) are kept in oracle/banc-cache.json and
 * reused: the 1.0 plays the same moves as long as its fingerprint holds. A
 * tested version is always searched again. Results in data/banc.json.
 */
const args = process.argv.slice(2);
const option = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
const ROOT = new URL("../", import.meta.url);
const V1 = BOT_LINEUP.experimental.engine;
const tested = args.find((arg, i) => !arg.startsWith("--") && !args[i - 1]?.startsWith("--")) ?? V1;
const against = option("--against", V1);
const positionsName = option("--positions", "banc");
if (args.includes("--threads")) process.env.LOPIN_THREADS = option("--threads", "");
const BATCH = 20;
const pct = (x) => `${(100 * x).toFixed(1).replace(".", ",")} %`;
const pts = (x) => `${x >= 0 ? "+" : ""}${(100 * x).toFixed(2).replace(".", ",")}`;
const keyOf = (entry) => `${entry.key}|${entry.turn}`;
const readJson = (path, fallback) => readFile(new URL(path, ROOT), "utf8").then(JSON.parse, () => fallback);
const writeJson = (path, value) => writeFile(new URL(path, ROOT), `${JSON.stringify(value, null, 1)}\n`);

async function readEntries() {
  const text = await readFile(new URL(`oracle/positions-${positionsName}.jsonl`, ROOT), "utf8").catch(() => "");
  return text.split("\n").filter(Boolean).map((line) => JSON.parse(line)).filter((entry) => !entry.skipped && entry.visits?.length > 0);
}

/** One move per position for `engine`, in batches grouped by file (each worker reads a file once). */
async function movesOf(engine, entries, known = {}) {
  const todo = entries.filter((entry) => !known[keyOf(entry)]).sort((a, b) => a.file.localeCompare(b.file));
  const batches = [];
  for (let i = 0; i < todo.length; i += BATCH) batches.push({ entries: todo.slice(i, i + BATCH), engine });
  const results = await runPool(new URL("./lib/banc-worker.js", import.meta.url), batches);
  const moves = { ...known };
  for (const result of results.flat()) moves[`${result.key}|${result.turn}`] = { move: result.move, coreTop: result.coreTop };
  return moves;
}

/** The reference's moves, from the cache when it has them. */
async function referenceMoves(entries) {
  const cache = await readJson("oracle/banc-cache.json", {});
  const moves = await movesOf(against, entries, cache[against] ?? {});
  cache[against] = moves;
  await writeJson("oracle/banc-cache.json", cache);
  return moves;
}

const judged = (entries, moves) => entries.map((entry) => judge(entry, moves[keyOf(entry)]));

function printSummary(label, summary) {
  console.log(`  ${label.padEnd(12)} valeur oracle ${pct(summary.value)} · même coup (positions stables) ${pct(summary.agrees)} · favori dans le top 8 du cœur ${pct(summary.top8)}`);
  for (const phase of summary.phases) console.log(`    ${phase.name.padEnd(12)} ${String(phase.positions).padStart(5)} positions : valeur ${pct(phase.value)}, même coup ${pct(phase.agrees)}`);
}

async function compare() {
  const entries = await readEntries();
  if (entries.length === 0) throw new Error(`Aucune position avec les visites de l'oracle dans oracle/positions-${positionsName}.jsonl`);
  const started = Date.now();
  console.log(`Banc : ${entries.length} positions, ${tested} contre ${against}`);
  const reference = judged(entries, await referenceMoves(entries));
  const rows = tested === against ? reference : judged(entries, await movesOf(tested, entries));
  const [mine, theirs] = [summarizeBanc(rows), summarizeBanc(reference)];
  printSummary("testée", mine);
  printSummary("référence", theirs);
  const gap = pairedDiff(rows, reference);
  const verdict = bancVerdict(gap);
  console.log(`  écart de valeur oracle : ${pts(gap.mean)} points (fourchette à 95 % par paires : ${pts(gap.low)} – ${pts(gap.high)}), ${gap.differ} positions où les deux jouent autrement → ${verdict}`);
  console.log(`  ${((Date.now() - started) / 60000).toFixed(1)} min`);
  const file = await readJson("data/banc.json", { note: "npm run banc : la similitude avec l'oracle, version par version.", runs: {} });
  file.runs[tested] = { built: new Date().toISOString().slice(0, 10), oracle: ORACLE.version, against, positions: entries.length, ...mine, gap, verdict };
  await writeJson("data/banc.json", file);
  return { gap, verdict };
}

async function calibrate() {
  const entries = await readEntries();
  const { versions, via } = await readJson("data/banc-calibration.json", { versions: [] });
  console.log(`Calibration du banc : ${versions.length} versions au résultat connu, ${entries.length} positions`);
  const rows = [];
  for (const version of versions) {
    const summary = summarizeBanc(judged(entries, await movesOf(version.engine, entries)));
    const score = version.against === "1.0" ? againstBase(version.score, via) : version.score;
    rows.push({ name: version.name, engine: version.engine, value: summary.value, top8: summary.top8, early: summary.phases[0].value, score });
    console.log(`  ${version.name.padEnd(14)} valeur oracle ${pct(summary.value)} (début ${pct(summary.phases[0].value)}) · duels ${pct(score)} contre le 0.9`);
  }
  const correlation = { value: rankCorrelation(rows.map((r) => r.value), rows.map((r) => r.score)), early: rankCorrelation(rows.map((r) => r.early), rows.map((r) => r.score)), top8: rankCorrelation(rows.map((r) => r.top8), rows.map((r) => r.score)) };
  console.log(`  corrélation de rang avec les duels : valeur ${correlation.value.toFixed(2)}, valeur au début ${correlation.early.toFixed(2)}, top 8 du cœur ${correlation.top8.toFixed(2)}`);
  const file = await readJson("data/banc.json", { note: "npm run banc : la similitude avec l'oracle, version par version.", runs: {} });
  file.calibration = { built: new Date().toISOString().slice(0, 10), oracle: ORACLE.version, positions: entries.length, rows, correlation };
  await writeJson("data/banc.json", file);
}

/** The four long duels that decide, queued after the backlog's last job, a pause between two. */
async function queueDuels() {
  const path = "data/backlog.json";
  const backlog = await readJson(path, { jobs: [] });
  const name = (/core=(\w+)/.exec(tested)?.[1] ?? "variante").replace(/[^\w-]/g, "");
  const pause = (n) => ({ id: `pause-${name}-${n}`, command: "npm run cooldown -- 15", estimate: "15 min", limit: 17, why: "Une pause entre deux jobs (Sami, 04/10).", status: "todo" });
  const offset = (n) => (n ? ` --offset ${n}` : "");
  const duel = (n) => ({ id: `duel-${name}-${n}`, command: `npm run duel -- "${tested}" "${V1}" --long --page${offset(n)}`, estimate: "20 min", limit: 30, why: `Passée au banc de similitude (npm run banc) : le jeu de donnes ${n + 1} sur 4 des duels longs qui décident (fourchette basse réunie au-dessus de 50 %, npm run versus).`, status: "todo" });
  const jobs = [0, 1, 2, 3].flatMap((n) => (n === 0 ? [duel(n)] : [pause(n), duel(n)]));
  backlog.jobs.push(...jobs);
  // The backlog keeps its own two-space indent.
  await writeFile(new URL(path, ROOT), `${JSON.stringify(backlog, null, 2)}
`);
  console.log(`${jobs.length} jobs ajoutés au backlog (${jobs.filter((job) => job.id.startsWith("duel")).length} duels longs) : npm run backlog`);
}

if (args.includes("--calibrate")) await calibrate();
else {
  await compare();
  if (args.includes("--queue")) await queueDuels();
}
