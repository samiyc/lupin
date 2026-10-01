import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { BOT_LINEUP } from "../../src/config/bots.js";
import { localTimestamp } from "../../src/replay/log.js";
import { isSlowEngine } from "./duel-plan.js";

/**
 * Keeping a duel's games as replays (`src/replay/bot-games.js`), in duels/
 * (ignored by git): one file per duel, its settings and every game.
 *
 * Saved when asked (`--save`), and whenever the games are solid enough to
 * build on: a long duel, or one where every bot plays at full strength — a
 * line-up version, a bot that does not search, or a search of 800 iterations
 * or more, or on a clock (`@t`).
 */
export const DUELS_DIR = fileURLToPath(new URL("../../duels/", import.meta.url));

const LINEUP_ENGINES = new Set(Object.values(BOT_LINEUP).map((bot) => bot.engine));

const solid = (engine) => {
  if (!isSlowEngine(engine) || LINEUP_ENGINES.has(engine)) return true;
  const budget = /@(t?)(\d+)/.exec(engine);
  return Boolean(budget) && (budget[1] === "t" || Number(budget[2]) >= 800);
};

export const shouldSave = ({ asked, profileName, engines }) => asked || profileName === "long" || engines.every(solid);

/** How often the side holding the game once the pile is empty went on to win it. */
function advantageSummary(logs) {
  const advantages = logs.map((log) => ({ advantage: log.analysis.advantage, winner: log.result.winner }));
  const ended = advantages.filter(({ advantage }) => advantage.ended).length;
  const solved = advantages.filter(({ advantage }) => !advantage.ended && Number.isInteger(advantage.value));
  const held = solved.filter(({ advantage, winner }) => advantage.winner === winner).length;
  const pct = solved.length ? Math.round((100 * held) / solved.length) : 0;
  return `${ended} finies avant le tour 30 ; sur les ${solved.length} résolues au tour 30, le camp en avance gagne dans ${pct} %`;
}

/** Writes the duel and returns a line for the report. */
export async function saveDuel({ a, b, engines, settings, logs }) {
  await mkdir(DUELS_DIR, { recursive: true });
  const stamp = localTimestamp().slice(0, 19).replace(/[:T]/g, "-");
  const name = `${stamp}_${a}_vs_${b}.json`.replace(/[^\w.@+=-]/g, "_");
  const file = `${DUELS_DIR}${name}`;
  await writeFile(file, JSON.stringify({ format: "lopin-duel/1", a, b, engines, ...settings, games: logs }));
  return `  replays : ${logs.length} parties → duels/${name} (${advantageSummary(logs)})`;
}
