import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { OFFICIAL_RULES } from "../src/config/rules.js";
import { formatCard } from "../src/core/notation.js";
import { createRng } from "../src/core/random.js";
import { playLogged, rulesOf, startLog } from "../src/replay/log.js";
import { engineFor } from "../src/sim/bots.js";
import { createGame, legalMoves } from "../src/sim/game.js";
import { winsAtNextClaim } from "../src/sim/immediate.js";

/**
 * `npm run puzzles:immediate`: mid-game puzzles under the claim rule. In
 * seeded Stratège self-play, a position is kept when some moves — but not
 * most — make the win certain at the next claim (`immediate.js`), and the
 * fast core itself misses them. The pile is not empty: the opponent's hand
 * stays hidden, and the proof does not need it. They join the endgame
 * puzzles in web/data/puzzles.json, marked `kind: "immediate"`; running it
 * again replaces them. A minute or two.
 */
const GAMES = 2000;
const COUNT = 20;
const SHARE = 0.25;
const text = (state, move) => `${formatCard(state.spec, move.card)}→${move.border + 1}`;

function examine(state) {
  const moves = legalMoves(state);
  if (state.pile.length === 0 || moves.length < 6) return null;
  const winning = moves.filter((move) => winsAtNextClaim(state, move));
  if (winning.length === 0 || winning.length / moves.length > SHARE) return null;
  const coreMove = engineFor("strategist")(createRng(1)).choose(state, moves);
  if (winning.some((move) => move.card === coreMove.card && move.border === coreMove.border)) return null;
  return { moves: moves.length, solutions: winning.map((move) => text(state, move)), coreMove: text(state, coreMove) };
}

function gamePuzzle(seed) {
  const rng = createRng(seed);
  const bots = [engineFor("strategist")(rng), engineFor("strategist")(rng)];
  const { spec, order, jokerRule, endMode } = rulesOf(OFFICIAL_RULES);
  const state = createGame(spec, { order, jokerRule, endMode, rng });
  const log = startLog(state, { rules: OFFICIAL_RULES, players: [], seed, startedAt: "" });
  while (!state.over) {
    const found = examine(state);
    if (found) return { ...found, turn: state.turn + 1, cardsLeft: state.pile.length, log: JSON.parse(JSON.stringify(log)) };
    const moves = legalMoves(state);
    playLogged(log, state, moves.length > 0 ? bots[state.current].choose(state, moves) : null);
  }
  return null;
}

const started = Date.now();
const found = [];
for (let seed = 1; seed <= GAMES && found.length < COUNT; seed += 1) {
  const puzzle = gamePuzzle(seed);
  if (puzzle) found.push(puzzle);
}
const file = fileURLToPath(new URL("../web/data/puzzles.json", import.meta.url));
const data = JSON.parse(await readFile(file, "utf8"));
const endgames = data.puzzles.filter((puzzle) => puzzle.kind !== "immediate");
const strip = (log) => ({ format: log.format, rules: log.rules, deck: log.deck, turns: log.turns.map(({ turn, player, move, pass, drew }) => ({ turn, player, move, pass, drew })) });
const immediate = found.map((p, i) => ({ id: 101 + i, kind: "immediate", turn: p.turn, cardsLeft: p.cardsLeft, moves: p.moves, solutions: p.solutions, coreMove: p.coreMove, coreFails: true, log: strip(p.log) }));
await writeFile(file, `${JSON.stringify({ ...data, puzzles: [...endgames, ...immediate] })}\n`);
process.stdout.write(`${immediate.length} puzzles « gain immédiat » gardés, ${endgames.length} fins de partie inchangées — ${((Date.now() - started) / 1000).toFixed(0)} s\n`);
