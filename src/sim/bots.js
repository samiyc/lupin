import { isJoker, valueOf } from "../core/cards.js";
import { EXPERIMENT } from "./experimental.js";
import { createValuer, sidePotential, unseenCards } from "./potential.js";
import { IDEAS, IDEA_WEIGHTS, STRATEGIST_IDEAS } from "./ideas.js";
import { HABITS, STRATEGY, strategistMoves } from "./strategist.js";

/**
 * Players for the simulation and the web game.
 *
 * `random` plays any legal card anywhere: it shows what the deck gives when
 * nobody chooses. `greedy` plays the card that most raises its chance of
 * winning one border, measured against what the opponent's side is likely
 * to become. `strategist` is `greedy` plus Sami's habits (`strategist.js`);
 * `experimental` is the strategist with its own settings (`experimental.js`).
 * None looks ahead.
 *
 * Every bot is `{ name, scoreMoves(state, moves, options), choose(state, moves) }`.
 * `scoreMoves` returns each candidate with its gain: the replay logs and the
 * observer's "why this move" panel read it. `options.keepAll` keeps the moves
 * a bot refuses to consider (marked `refused`), to advise on a human's move.
 */
const TEMPERATURE = 0.35;
const JOKER_COST = 0.08;
const CARD_COST = 0.02;
/** Slope of the win chance at even odds: value units → win-chance units. */
const VALUE_TO_CHANCE = 1 / (4 * TEMPERATURE);

export const randomBot = (rng) => ({
  name: "random",
  scoreMoves: (_state, moves) => moves.map((move) => ({ move, gain: 0 })),
  choose: (_state, moves) => moves[rng.int(moves.length)],
});

export const greedyBot = (rng) => ({
  name: "greedy",
  scoreMoves: scoreGreedy,
  choose: (state, moves) => pickBest(scoreGreedy(state, moves), rng),
});

/**
 * `greedy` plus some of Sami's habits (all three by default), and optionally
 * some of his later ideas (`ideas.js`, none by default).
 */
export const strategistBot = (rng, { habits = HABITS, strategy = STRATEGY, ideas = [], weights = IDEA_WEIGHTS, name } = {}) => {
  const set = new Set(habits);
  const tuning = { habits: set, strategy, ideas: new Set(ideas), weights };
  const scoreMoves = (state, moves, { keepAll = false } = {}) => scoreStrategist(state, moves, { ...tuning, keepAll });
  return {
    name: name ?? (habits.length === HABITS.length ? "strategist" : `strategist:${habits.join("+")}`),
    scoreMoves,
    choose: (state, moves) => pickBest(scoreMoves(state, moves), rng),
  };
};

/** The highest gain, ties broken at random. */
export function pickBest(scored, rng) {
  let best = [];
  let bestGain = -Infinity;
  for (const { move, gain } of scored) {
    if (gain > bestGain + 1e-9) [best, bestGain] = [[move], gain];
    else if (gain > bestGain - 1e-9) best.push(move);
  }
  return best[rng.int(best.length)];
}

/** May one more joker join `side`? Asked once per side, not once per card. */
function jokerGate(state, player) {
  const { maxPerSide, maxPerPlayer } = state.jokerRule;
  const underPlayerCap = state.jokersPlayed[player] < maxPerPlayer;
  return (side) => underPlayerCap && side.filter(isJoker).length < maxPerSide;
}

function views(state) {
  const player = state.current;
  const shared = { valuer: createValuer(state), unseen: unseenCards(state, player) };
  const mine = { ...shared, draws: Math.ceil(state.pile.length / 2), jokerAllowed: jokerGate(state, player) };
  // The opponent's hand is unknown: treat it as more draws from the unseen.
  const theirs = {
    ...shared,
    hand: [],
    draws: state.spec.handSize + Math.floor(state.pile.length / 2),
    jokerAllowed: jokerGate(state, 1 - player),
  };
  const threat = state.borders.map((border) => sidePotential(border.sides[1 - player], theirs));
  return { mine, threat };
}

function scoreGreedy(state, moves) {
  const { mine, threat } = views(state);
  return moves.map((move) => ({ move, gain: moveGain(state, move, mine, threat[move.border]) }));
}

/** What the ideas read on top of the strategist's context; nothing when none is on. */
function ideasContext(state, player, { ideas, weights }) {
  if (ideas.size === 0) return {};
  return {
    ideas,
    weights,
    hand: state.hands[player],
    theirSides: state.borders.map((border) => border.sides[1 - player]),
    boardCards: state.borders.flatMap((border) => border.sides.flat()),
  };
}

function scoreStrategist(state, moves, { habits, strategy, keepAll, ...tuning }) {
  const { mine, threat } = views(state);
  const player = state.current;
  const context = {
    spec: state.spec,
    evaluator: state.evaluator,
    unseen: mine.unseen,
    mySides: state.borders.map((border) => border.sides[player]),
    habits,
    strategy,
    ...ideasContext(state, player, tuning),
  };
  return strategistMoves(moves, (move) => state.borders[move.border].sides[player], context, {
    gainOf: (move) => moveGain(state, move, mine, threat[move.border]),
    scale: VALUE_TO_CHANCE,
    keepAll,
  });
}

const winChance = (mine, theirs) => 1 / (1 + Math.exp((theirs - mine) / TEMPERATURE));

function moveGain(state, { card, border }, context, threat) {
  const hand = [...state.hands[state.current]];
  hand.splice(hand.indexOf(card), 1);
  const withHand = { ...context, hand };
  const side = state.borders[border].sides[state.current];
  const before = winChance(sidePotential(side, withHand), threat);
  const after = winChance(sidePotential([...side, card], withHand), threat);
  return after - before - cardCost(state.spec, card);
}

/** Spending a joker or a high card has a price: keep them for later. */
export function cardCost(spec, card) {
  if (isJoker(card)) return JOKER_COST;
  return (CARD_COST * valueOf(spec, card)) / spec.values;
}

export { VALUE_TO_CHANCE };

/** Bot engines by id. The public line-up (names, versions) is `src/config/bots.js`. */
export const BOTS = Object.freeze({
  random: randomBot,
  greedy: greedyBot,
  strategist: (rng) => strategistBot(rng, { ideas: STRATEGIST_IDEAS, name: "strategist" }),
  experimental: (rng) => strategistBot(rng, { ...EXPERIMENT, name: "experimental" }),
  // One habit at a time, to weigh each against the plain greedy bot.
  "strategist:joker": (rng) => strategistBot(rng, { habits: ["joker"] }),
  "strategist:opening": (rng) => strategistBot(rng, { habits: ["opening"] }),
  "strategist:suited": (rng) => strategistBot(rng, { habits: ["suited"] }),
  // The three habits without the ideas: strategist 1.0.0, for the report.
  "strategist:habits": (rng) => strategistBot(rng, { name: "strategist:habits" }),
  // The three habits plus one idea at a time, to weigh each idea on its own.
  ...Object.fromEntries(IDEAS.map((idea) => [`idea:${idea}`, (rng) => strategistBot(rng, { ideas: [idea], name: `idea:${idea}` })])),
});
