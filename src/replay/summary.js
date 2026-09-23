import { FORMATIONS } from "../config/formations.js";
import { JOKER_TEXT } from "../core/notation.js";
import { replayStates } from "./log.js";

/**
 * What a pile of replay logs says: results against each bot version, the
 * formations each side built, where the jokers went, and — for human moves —
 * how often the advisor bot would have played the same card on the same
 * border. Pure; `npm run replays` feeds it the saved files.
 */
const zeroFormations = () => Object.fromEntries(FORMATIONS.map((f) => [f, 0]));

const opponentOf = (log, seat) => log.players.find((player) => player.seat !== seat);
const tagOf = (player) => (player.kind === "human" ? "humain" : `${player.bot}@${player.version}`);

function tallyResult(summary, log) {
  const human = log.players.find((player) => player.kind === "human");
  if (!human) return;
  const key = tagOf(opponentOf(log, human.seat));
  summary.vsBots[key] ??= { games: 0, won: 0, lost: 0, drawn: 0 };
  const line = summary.vsBots[key];
  line.games += 1;
  if (log.result.winner === null) line.drawn += 1;
  else if (log.result.winner === human.seat) line.won += 1;
  else line.lost += 1;
}

function tallyBorders(summary, log) {
  for (const border of log.result.borders) {
    border.sides.forEach((side, seat) => {
      const kind = log.players.find((player) => player.seat === seat).kind;
      summary.formations[kind][border.formations[seat]] += 1;
      if (side.includes(JOKER_TEXT)) summary.jokers[kind][border.formations[seat]] += 1;
    });
  }
}

function tallyAdvice(summary, log, advisor) {
  if (!advisor || !log.players.some((player) => player.kind === "human")) return;
  for (const { entry, advice, adviceGap } of replayStates(log, { advisor }).slice(1)) {
    if (adviceGap === null) continue;
    summary.advice.moves += 1;
    if (adviceGap < 1e-9) summary.advice.agreed += 1;
    else summary.advice.examples.push({ startedAt: log.startedAt, turn: entry.turn, hand: entry.hand, played: entry.move, advised: advice[0], gap: adviceGap });
  }
  summary.advice.examples.sort((a, b) => b.gap - a.gap);
}

/** `logs`: parsed replay logs; `advisor`: a bot to weigh human moves, or null. */
export function summarizeReplays(logs, { advisor = null } = {}) {
  const summary = {
    games: logs.length,
    vsBots: {},
    formations: { human: zeroFormations(), bot: zeroFormations() },
    jokers: { human: zeroFormations(), bot: zeroFormations() },
    advice: { moves: 0, agreed: 0, examples: [] },
  };
  for (const log of logs.filter((candidate) => candidate.result)) {
    tallyResult(summary, log);
    tallyBorders(summary, log);
    tallyAdvice(summary, log, advisor);
  }
  return summary;
}
