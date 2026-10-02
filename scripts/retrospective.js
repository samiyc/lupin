import { readFile, writeFile } from "node:fs/promises";
import { OFFICIAL_RULES } from "../src/config/rules.js";
import { formatCard } from "../src/core/notation.js";
import { createRng } from "../src/core/random.js";
import { fitElo, resultsFromLogs } from "../src/replay/elo.js";
import { rulesOf } from "../src/replay/log.js";
import { explainMove, strategistBot } from "../src/sim/bots.js";
import { EXPERIMENT } from "../src/sim/experimental.js";
import { applyMove, createGame, legalMoves } from "../src/sim/game.js";
import { IDEA_WEIGHTS } from "../src/sim/ideas.js";
import { HABITS, STRATEGY } from "../src/sim/strategist.js";
import { BOT_PARAMS, VALUE_TO_CHANCE } from "../src/sim/bots.js";
import { coreTimings } from "./lib/core-timing.js";
import { ANCHOR, readAllLogs, readDuels } from "./lib/elo-data.js";

/**
 * `npm run retrospective`: the robot's retrospective, out/retrospective.html
 * (and out/artifact/retrospective.html, the page without its skeleton). No
 * figure is typed by hand:
 * - the Elo of all ten versions, fitted on data/elo-duels.json, the human
 *   games, and the three duels of the versions retired on 01/10 (kept here
 *   with their source, git abe6a0e), so that every version sits on one scale;
 * - the story of each version: data/retrospective.json;
 * - the price of an error, turn by turn: data/error-impact.json;
 * - a move scored by the experimental core, computed now on a seeded game;
 * - what the core costs in ms (scripts/lib/core-timing.js), measured now:
 *   build it on an idle machine;
 * - every bonus with its weights read from the code, and the core tests of
 *   data/core-tests.json when there are some.
 */
const ROOT = new URL("../", import.meta.url);
const read = async (path) => JSON.parse(await readFile(new URL(path, ROOT), "utf8"));
const ARCHIVED = [
  { a: "stratege@1.0.0", b: "basique@1.0.0", score: 2308, games: 4000 },
  { a: "experimental@0.5.0", b: "stratege@2.1.0", score: 60, games: 96 },
  { a: "experimental@0.6.0", b: "experimental@0.5.0", score: 121, games: 240 },
];
const EXAMPLE = { seed: 7, turn: 8, shown: 8 };

async function ratings() {
  const duels = (await readDuels()).duels.map(({ a, b, wins, games }) => ({ a, b, score: wins, games }));
  const humans = resultsFromLogs(await readAllLogs());
  return fitElo([...humans, ...duels, ...ARCHIVED], { anchor: ANCHOR });
}

/** A seeded game between two experimental cores, stopped at `turn`, and its best moves taken apart. */
function coreExample() {
  const { spec, order, jokerRule, endMode } = rulesOf(OFFICIAL_RULES);
  const rng = createRng(EXAMPLE.seed);
  const cores = [strategistBot(rng, EXPERIMENT), strategistBot(rng, EXPERIMENT)];
  const state = createGame(spec, { order, jokerRule, endMode, rng });
  while (state.turn < EXAMPLE.turn) applyMove(state, cores[state.current].choose(state, legalMoves(state)));
  const me = state.current;
  const label = (card) => formatCard(spec, card);
  const scored = strategistBot(createRng(1), EXPERIMENT).scoreMoves(state, legalMoves(state), { keepAll: true });
  const moves = scored
    .map(({ move, gain, refused }) => {
      const parts = explainMove(state, move);
      return { card: label(move.card), border: move.border + 1, ...parts, gain, bonus: gain - (parts.after - parts.before - parts.cost), refused: Boolean(refused) };
    })
    .sort((a, b) => Number(a.refused) - Number(b.refused) || b.gain - a.gain)
    .slice(0, EXAMPLE.shown);
  const borders = state.borders.map((border) => ({ mine: border.sides[me].map(label), theirs: border.sides[1 - me].map(label) }));
  return { turn: state.turn + 1, hand: state.hands[me].map(label), borders, moves };
}

/** Each bonus of data/retrospective.json with its weights from the code and whether the 0.9's core plays it. */
function bonusRows(bonuses) {
  const weights = { ...STRATEGY, ...IDEA_WEIGHTS };
  const inCore = (key) => HABITS.includes(key) || EXPERIMENT.ideas.includes(key);
  return bonuses.map((bonus) => ({ ...bonus, values: bonus.weights.map((name) => `${name} ${String(weights[name]).replace(".", ",")}`), inCore: inCore(bonus.key) }));
}

const optional = (path) => read(path).catch(() => null);
const elo = await ratings();
const retro = await read("data/retrospective.json");
const data = {
  built: new Date().toISOString().slice(0, 10).split("-").reverse().join("/"),
  elo,
  retro: { ...retro, bonuses: bonusRows(retro.bonuses) },
  params: { ...BOT_PARAMS, valueToChance: VALUE_TO_CHANCE },
  timings: coreTimings(),
  coreTests: await optional("data/core-tests.json"),
  impact: await read("data/error-impact.json"),
  example: coreExample(),
};
const missing = data.retro.versions.filter((version) => !elo[version.tag]).map((version) => version.tag);
if (missing.length) throw new Error(`Pas d'Elo pour : ${missing.join(", ")}`);

const template = await readFile(new URL("src/report/retro/template.html", ROOT), "utf8");
// The data lands inside a <script>: "</" is escaped so no text in it can close the tag.
const page = template.replace("/*__DATA__*/null", JSON.stringify(data).replaceAll("</", "<\\/"));
await writeFile(new URL("out/artifact/retrospective.html", ROOT), page);
const cut = page.indexOf('<header class="band">');
const head = '<!doctype html>\n<html lang="fr">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n';
await writeFile(new URL("out/retrospective.html", ROOT), `${head}${page.slice(0, cut)}</head>\n<body>\n${page.slice(cut)}</body>\n</html>\n`);
const line = (tag) => `${tag} ${elo[tag].elo}`;
console.log(`Rétrospective : ${data.retro.versions.length} versions (${line("basique@1.0.0")} … ${line("experimental@0.9.0")}), exemple au tour ${data.example.turn} → out/retrospective.html`);
