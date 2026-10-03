import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { BOT_LINEUP } from "../src/config/bots.js";

/**
 * `npm run changelog -- [1.0]`: the changelog of a version of the
 * Experimental, out/changelog-exp-<version>.html (and its copy without the
 * skeleton in out/artifact/) — every attempt that led to it, the night jobs,
 * the speed passes, the oracle, with real positions to play through. One per
 * version (Sami, 03/10); the version defaults to the line-up's.
 *
 * What was measured once and written down (the duels' scores, the example
 * positions, the commits' French labels) is data/changelog-exp-<version>.json; what a script
 * keeps up to date is read where it lives:
 * - the price of an error, turn by turn: data/error-impact.json;
 * - the oracle's gaps and traits: data/oracle-diffs.json;
 * - where the jokers went: data/jokers-mining.json;
 * - the borders won with low cards: data/weak-wins.json;
 * - the core's speed: data/core-timings.json;
 * - the night and day jobs: data/backlog.json and data/backlog-done.json;
 * - the puzzles: web/data/puzzles.json;
 * - the oracle where two cores disagree: data/oracle-disagree.json, if read;
 * - the commits since `since`: git log.
 * Rebuilt after the night's jobs, the page picks up their times by itself;
 * their scores go into the version's data file.
 */
const ROOT = new URL("../", import.meta.url);
const read = async (path) => JSON.parse(await readFile(new URL(path, ROOT), "utf8"));
const MIN_JOKERS = 60;

function commits(since) {
  // git is a developer tool found on PATH, like npm that runs this script.
  // eslint-disable-next-line sonarjs/no-os-command-from-path
  const log = execFileSync("git", ["log", `--since=${since}`, "--reverse", "--format=%ad|%h|%s", "--date=format:%Y-%m-%dT%H:%M"], { cwd: new URL(".", ROOT), encoding: "utf8" });
  return log.trim().split("\n").filter(Boolean).map((line) => {
    const [at, hash, ...subject] = line.split("|");
    return { at, hash, subject: subject.join("|") };
  });
}

const jobsOf = (file) => (file.jobs ?? file).map(({ id, status, doneAt, minutes, estimate, notBefore }) => ({ id, status, doneAt, minutes, estimate, notBefore }));

/** Where a joker went, one trait at a time (not crossed), on enough jokers to read. */
const placements = (mining) => mining.stats.filter((row) => row.count >= MIN_JOKERS && !row.key.includes("·")).map(({ key, count, game, border }) => ({ key, count, game, border }));

function puzzleKinds(puzzles) {
  const kinds = {};
  for (const puzzle of puzzles) kinds[puzzle.kind ?? "endgame"] = (kinds[puzzle.kind ?? "endgame"] ?? 0) + 1;
  return kinds;
}

const now = new Date();
const pad = (n) => String(n).padStart(2, "0");
const version = process.argv[2] ?? BOT_LINEUP.experimental.version;
const name = `changelog-exp-${version}`;
const journal = await read(`data/${name}.json`);
const data = {
  version,
  built: `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`,
  builtAt: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`,
  journal,
  commits: commits(journal.since),
  impact: await read("data/error-impact.json"),
  oracle: await read("data/oracle-diffs.json"),
  jokers: placements(await read("data/jokers-mining.json")),
  weakWins: await read("data/weak-wins.json"),
  timings: await read("data/core-timings.json"),
  jobs: [...jobsOf(await read("data/backlog-done.json")), ...jobsOf(await read("data/backlog.json"))],
  puzzles: puzzleKinds((await read("web/data/puzzles.json")).puzzles),
  disagree: await read("data/oracle-disagree.json").catch(() => null),
};

const template = await readFile(new URL("src/report/changelog/template.html", ROOT), "utf8");
// The data lands inside a <script>: "</" is escaped so no text in it can close the tag.
const page = template.replaceAll("__VERSION__", version).replace("/*__DATA__*/null", JSON.stringify(data).replaceAll("</", "<\\/"));
await writeFile(new URL(`out/artifact/${name}.html`, ROOT), page);
const cut = page.indexOf('<header class="band">');
const head = '<!doctype html>\n<html lang="fr">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n';
await writeFile(new URL(`out/${name}.html`, ROOT), `${head}${page.slice(0, cut)}</head>\n<body>\n${page.slice(cut)}</body>\n</html>\n`);
const measured = journal.attempts.filter((attempt) => attempt.score !== null).length;
console.log(`Changelog Exp v${version} : ${measured} essais mesurés, ${data.commits.length} commits, ${data.jobs.length} jobs → out/${name}.html`);
