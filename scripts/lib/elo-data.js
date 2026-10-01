import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { fitElo, resultsFromLogs } from "../../src/replay/elo.js";
import { statsOf } from "../../src/replay/stats.js";
import { REPLAY_DIRS, isSafeName } from "./replay-files.js";

/**
 * The Elo table as the server and `npm run elo` compute it: every saved human
 * game (replays/, replays/OLD/, data/replays/) plus the bot duels of
 * data/elo-duels.json, anchored on Basique at 500 (as table tennis starts its players).
 */
const ROOT = fileURLToPath(new URL("../../", import.meta.url));
export const DUELS_FILE = join(ROOT, "data/elo-duels.json");
export const ANCHOR = "basique@1.0.0";

async function readLogs(dir) {
  const names = await readdir(join(ROOT, dir)).catch(() => []);
  return Promise.all(names.filter(isSafeName).map(async (name) => JSON.parse(await readFile(join(ROOT, dir, name), "utf8"))));
}

export async function readDuels() {
  return JSON.parse(await readFile(DUELS_FILE, "utf8"));
}

/** Every saved game: recent, archived (replays/OLD) and kept. */
export async function readAllLogs() {
  return (await Promise.all([REPLAY_DIRS.recent, `${REPLAY_DIRS.recent}/OLD`, REPLAY_DIRS.kept].map(readLogs))).flat();
}

/** What the "Stats" tab shows (`/api/stats`): per-opponent lines, formations, and the Elo table. */
export async function statsPage() {
  return { ...statsOf(await readAllLogs()), elo: await eloTable() };
}

/** `[{ player, elo, margin, games, human }]`, strongest first. */
export async function eloTable() {
  const logs = await readAllLogs();
  const humans = resultsFromLogs(logs);
  const duels = (await readDuels()).duels.map(({ a, b, wins, games }) => ({ a, b, score: wins, games }));
  const ratings = fitElo([...humans, ...duels], { anchor: ANCHOR });
  const humanNames = new Set(humans.map((result) => result.a));
  return Object.entries(ratings)
    .map(([player, rating]) => ({ player, ...rating, human: humanNames.has(player) }))
    .sort((x, y) => y.elo - x.elo);
}
