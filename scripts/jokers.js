import { writeFile } from "node:fs/promises";
import { replayStates, rulesOf } from "../src/replay/log.js";
import { jokerTraits } from "../src/replay/joker-features.js";
import { loadGame, readIndex } from "./lib/game-index.js";

/**
 * `npm run jokers`: where the jokers of the kept bot games (duels/) went, and
 * what came of it (Sami, 02/10). Each joker put is read by `jokerTraits`
 * (src/replay/joker-features.js), alone and two by two (what it joins × what
 * faces it, × the border). For each: how many, how often its player won the
 * border it went on, and the game.
 *
 * Between bots of equal strength a game is won half the time: a placement
 * whose player wins 70 % of the time or more is one winners make and losers
 * do not — Sami's reading of "true in 80 % of the games".
 */
const MIN_COUNT = 60;
const WEAK_BOTS = /^(basique|stratege)@/;

/** Every joker put in a game: its traits, whether its player won that border and the game. */
function jokersOf(log) {
  const { spec } = rulesOf(log.rules);
  const frames = replayStates(log);
  const winners = new Map(log.result.borders.map((entry) => [entry.border - 1, entry.winner]));
  return frames.slice(1).flatMap(({ entry }, i) => {
    if (!entry || entry.pass || !entry.joker) return [];
    const border = entry.move.border - 1;
    const traits = jokerTraits({ ...frames[i].state, spec }, entry.player, border, entry.turn);
    const borderWinner = winners.get(border);
    return [{ traits, game: log.result.winner === entry.player, border: borderWinner === undefined || borderWinner === null ? null : borderWinner === entry.player }];
  });
}

/** The traits alone, and crossed: what the joker joins with what faces it, and with the border. */
const keysOf = ([mine, theirs, border, phase]) => [mine, theirs, border, phase, `${mine} · ${theirs}`, `${mine} · ${border}`, `${theirs} · ${border}`];

function addJoker(stats, key, joker) {
  const stat = stats.get(key) ?? { count: 0, games: 0, decided: 0, borders: 0 };
  stat.count += 1;
  stat.games += joker.game ? 1 : 0;
  stat.decided += joker.border === null ? 0 : 1;
  stat.borders += joker.border ? 1 : 0;
  stats.set(key, stat);
}

function tally(jokers) {
  const stats = new Map();
  for (const joker of jokers) for (const key of keysOf(joker.traits)) addJoker(stats, key, joker);
  return [...stats].map(([key, s]) => ({ key, count: s.count, game: s.games / s.count, border: s.decided ? s.borders / s.decided : null, decided: s.decided }));
}

const pct = (x) => (x === null ? "  —" : `${String(Math.round(100 * x)).padStart(3)} %`);

function report(title, rows) {
  console.log(`\n=== ${title}`);
  console.log("  partie  borne   jokers  placement");
  rows
    .filter((row) => row.count >= MIN_COUNT)
    .sort((a, b) => b.game - a.game)
    .forEach((row) => console.log(`  ${pct(row.game)}  ${pct(row.border)}  ${String(row.count).padStart(6)}  ${row.key}`));
}

const rows = (await readIndex()).filter((row) => row.winner === 0 || row.winner === 1);
const equal = rows.filter((row) => !row.players.some((player) => WEAK_BOTS.test(player)));
const jokers = [];
for (const row of equal) jokers.push(...jokersOf(await loadGame(row)));
const stats = tally(jokers);
report(`Jokers posés entre robots de même force : ${jokers.length}, dans ${equal.length} parties (au moins ${MIN_COUNT} par ligne)`, stats);
await writeFile(new URL("../data/jokers-mining.json", import.meta.url), `${JSON.stringify({ built: new Date().toISOString().slice(0, 10), games: equal.length, jokers: jokers.length, stats }, null, 1)}\n`);
