import { spawn } from "node:child_process";
import { createWriteStream } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { localTimestamp } from "../src/replay/log.js";

/**
 * `npm run backlog [-- --list]`: the long jobs kept for the night
 * (data/backlog.json), run one after the other. Each job's output goes to
 * backlog-runs/<date>_<id>.txt (ignored by git) and the job is marked done in
 * the file, with its date and duration, as soon as it ends — so stopping the
 * run (Ctrl+C) only loses the job in progress. `--list` shows the queue.
 *
 * No job runs longer than its `limit` in minutes (`LIMIT`, 2 h, by default:
 * Sami, 03/10), so that a job gone wrong does not eat the night. One that
 * reaches it is stopped, with every process under it, and marked `timeout`.
 */
const LIMIT = 120;
const ROOT = fileURLToPath(new URL("../", import.meta.url));
const FILE = `${ROOT}data/backlog.json`;
const RUNS = `${ROOT}backlog-runs/`;
const readBacklog = async () => JSON.parse(await readFile(FILE, "utf8"));
const saveBacklog = (backlog) => writeFile(FILE, `${JSON.stringify(backlog, null, 2)}\n`);

/** Stops `child` and everything it started (on Windows the shell's children outlive it otherwise). */
function stopTree(child) {
  if (process.platform === "win32") spawn(path.join(process.env.SystemRoot ?? "C:\\Windows", "System32", "taskkill.exe"), ["/pid", String(child.pid), "/T", "/F"]);
  else child.kill("SIGTERM");
}

/** Runs `command` in a shell, its output both on screen and in `outFile`; resolves with the exit code, or "timeout". */
function run(command, outFile, minutes) {
  const out = createWriteStream(outFile);
  return new Promise((resolve) => {
    const child = spawn(command, { cwd: ROOT, shell: true });
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      out.write(`
[backlog] arrêté au bout de ${minutes} min
`);
      stopTree(child);
    }, minutes * 60_000);
    for (const stream of [child.stdout, child.stderr]) {
      stream.on("data", (chunk) => {
        process.stdout.write(chunk);
        out.write(chunk);
      });
    }
    child.on("close", (code) => {
      clearTimeout(timer);
      out.end(() => resolve(timedOut ? "timeout" : code));
    });
  });
}

const statusOf = (code) => {
  if (code === "timeout") return "timeout";
  return code === 0 ? "done" : "failed";
};

const backlog = await readBacklog();
const pending = backlog.jobs.filter((job) => job.status === "todo");
if (process.argv.includes("--list")) {
  for (const job of backlog.jobs) {
    const done = job.doneAt ? " (fait le " + job.doneAt + ", " + job.minutes + " min)" : "";
    console.log(`[${job.status}] ${job.id} — ${job.estimate} — ${job.command}${done}`);
  }
  process.exit(0);
}
await mkdir(RUNS, { recursive: true });
console.log(`${pending.length} traitement(s) à faire.`);
// The next job is read from the file each time: one added while another ran is played too.
const tried = new Set();
const nextJob = async () => (await readBacklog()).jobs.find((job) => job.status === "todo" && !tried.has(job.id));
for (let job = await nextJob(); job; job = await nextJob()) {
  tried.add(job.id);
  const started = Date.now();
  const stamp = localTimestamp().slice(0, 16).replace(/[:T]/g, "-");
  const output = `backlog-runs/${stamp}_${job.id}.txt`;
  console.log(`\n▶ ${job.id} (${job.estimate}) : ${job.command}`);
  const code = await run(job.command, `${ROOT}${output}`, job.limit ?? LIMIT);
  // Re-read the file: someone may have added jobs while this one ran.
  const fresh = await readBacklog();
  const entry = fresh.jobs.find((candidate) => candidate.id === job.id);
  Object.assign(entry, { status: statusOf(code), doneAt: localTimestamp().slice(0, 16), minutes: Math.round((Date.now() - started) / 60000), output });
  await saveBacklog(fresh);
  console.log(`■ ${job.id} : ${entry.status}, ${entry.minutes} min → ${output}`);
}
