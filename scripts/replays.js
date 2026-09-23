import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { FORMATIONS, FORMATION_LABELS } from "../src/config/formations.js";
import { createRng } from "../src/core/random.js";
import { summarizeReplays } from "../src/replay/summary.js";
import { BOTS } from "../src/sim/bots.js";
import { REPLAY_DIRS, isSafeName } from "./lib/replay-files.js";

/**
 * `npm run replays`: what the saved games say — `replays/` and
 * `data/replays/` together. Human moves are weighed against the strategist.
 */
const ROOT = fileURLToPath(new URL("../", import.meta.url));

async function readLogs(dir) {
  const names = await readdir(join(ROOT, dir)).catch(() => []);
  return Promise.all(names.filter(isSafeName).map(async (name) => JSON.parse(await readFile(join(ROOT, dir, name), "utf8"))));
}

const pct = (part, whole) => (whole ? `${((100 * part) / whole).toFixed(0)} %` : "—");

function formationLines(title, counts) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  return [`${title} (${total} lignes)`, ...FORMATIONS.map((f) => `  ${FORMATION_LABELS[f].padEnd(14)} ${String(counts[f]).padStart(4)}  ${pct(counts[f], total)}`)];
}

const logs = [...(await readLogs(REPLAY_DIRS.recent)), ...(await readLogs(REPLAY_DIRS.kept))];
const summary = summarizeReplays(logs, { advisor: BOTS.strategist(createRng(1)) });

const lines = [`${summary.games} parties enregistrées (${REPLAY_DIRS.recent}/ et ${REPLAY_DIRS.kept}/)`, ""];
for (const [bot, line] of Object.entries(summary.vsBots)) {
  lines.push(`Contre ${bot} : ${line.games} parties, ${line.won} gagnées (${pct(line.won, line.games)}), ${line.lost} perdues, ${line.drawn} nulles`);
}
lines.push("", ...formationLines("Combinaisons de l'humain", summary.formations.human));
lines.push("", ...formationLines("Combinaisons des robots", summary.formations.bot));
lines.push("", ...formationLines("Lignes avec un joker (humain)", summary.jokers.human));
const { moves, agreed, examples } = summary.advice;
lines.push("", `Coups humains identiques au meilleur choix du Stratège : ${agreed} / ${moves} (${pct(agreed, moves)})`);
if (examples.length > 0) lines.push("Les plus grands écarts avec le Stratège :");
for (const example of examples.slice(0, 10)) {
  lines.push(`  ${example.startedAt.slice(0, 16)} tour ${example.turn} (écart ${example.gap.toFixed(3)}) : main ${example.hand.join(" ")} — joué ${example.played.card}→${example.played.border}, conseillé ${example.advised.card}→${example.advised.border}`);
}
const { refused } = summary.advice;
if (refused.length > 0) lines.push("", `Jokers posés hors d'une paire (le Stratège ne le fait jamais) : ${refused.length}`);
for (const move of refused) {
  lines.push(`  ${move.startedAt.slice(0, 16)} tour ${move.turn} : main ${move.hand.join(" ")} — joué ${move.played.card}→${move.played.border}`);
}
process.stdout.write(`${lines.join("\n")}\n`);
