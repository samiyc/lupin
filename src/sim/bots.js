import { isJoker, valueOf } from "../core/cards.js";
import { EXPERIMENT } from "./experimental.js";
import { createValuer, sidePotential, unseenCards } from "./potential.js";
import { IDEAS, IDEA_WEIGHTS, STRATEGIST_IDEAS, borderFactors } from "./ideas.js";
import { lookaheadBot } from "./lookahead.js";
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
/** The estimate's settings; a bot may carry its own (`params`), to be tuned. */
export const BOT_PARAMS = Object.freeze({ temperature: TEMPERATURE, jokerCost: JOKER_COST, cardCost: CARD_COST });

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
const STRATEGIST_DEFAULTS = Object.freeze({ habits: HABITS, strategy: STRATEGY, ideas: [], weights: IDEA_WEIGHTS, params: BOT_PARAMS });

export const strategistBot = (rng, options = {}) => {
  const { habits, strategy, ideas, weights, params, name } = { ...STRATEGIST_DEFAULTS, ...options };
  const tuning = { habits: new Set(habits), strategy, ideas: new Set(ideas), weights, params };
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
  // Each view gets its own memo: the same pair is judged many times in one scoring.
  const mine = { ...shared, draws: Math.ceil(state.pile.length / 2), jokerAllowed: jokerGate(state, player), memo: new Map() };
  // The opponent's hand is unknown: treat it as more draws from the unseen.
  const theirs = {
    ...shared,
    hand: [],
    draws: state.spec.handSize + Math.floor(state.pile.length / 2),
    jokerAllowed: jokerGate(state, 1 - player),
    memo: new Map(),
  };
  const threat = state.borders.map((border) => sidePotential(border.sides[1 - player], theirs));
  return { mine, threat };
}

function scoreGreedy(state, moves) {
  const { mine, threat } = views(state);
  return moves.map((move) => ({ move, gain: moveGain(state, move, mine, threat[move.border]) }));
}

/** The bot's own odds of winning each border, as things stand. */
function borderChances(state, player, { mine, threat }) {
  const withHand = { ...mine, hand: state.hands[player] };
  return state.borders.map((border, index) => winChance(sidePotential(border.sides[player], withHand), threat[index], mine.params));
}

/** What the ideas read on top of the strategist's context; nothing when none is on. */
function ideasContext(state, player, { ideas, weights }, seen) {
  if (ideas.size === 0) return {};
  return {
    ideas,
    weights,
    hand: state.hands[player],
    theirSides: state.borders.map((border) => border.sides[1 - player]),
    boardCards: state.borders.flatMap((border) => border.sides.flat()),
    pile: state.pile.length,
    chances: ideas.has("runs") || ideas.has("dump") ? borderChances(state, player, seen) : null,
  };
}

function scoreStrategist(state, moves, { habits, strategy, keepAll, params, ...tuning }) {
  const { threat, ...rest } = views(state);
  const mine = { ...rest.mine, params };
  const seen = { mine, threat };
  const player = state.current;
  const context = {
    spec: state.spec,
    evaluator: state.evaluator,
    unseen: mine.unseen,
    mySides: state.borders.map((border) => border.sides[player]),
    habits,
    strategy,
    memo: new Map(),
    ...ideasContext(state, player, tuning, seen),
  };
  const factors = context.ideas ? borderFactors(context, state.borders.length, context.chances) : null;
  const gainOf = context.ideas?.has("whole") ? wholeGains(state, seen) : (move) => moveGain(state, move, mine, threat[move.border]);
  return strategistMoves(moves, (move) => state.borders[move.border].sides[player], context, {
    gainOf: (move) => gainOf(move) * (factors?.[move.border] ?? 1),
    scale: 1 / (4 * params.temperature),
    keepAll,
  });
}

/**
 * `whole` (ideas.js): a move judged on the whole board. A card leaving the
 * hand also takes away what it promised the other borders — the 9♠ that would
 * have joined the 8♠ — which `moveGain` never counts. Gain = Σ over my borders
 * of the win chance after, minus before, minus the card's cost.
 */
function wholeGains(state, { mine, threat }) {
  const player = state.current;
  const sides = state.borders.map((border) => border.sides[player]);
  const hand = state.hands[player];
  const worth = (side, context, index) => winChance(sidePotential(side, context), threat[index], mine.params);
  const sum = (values) => values.reduce((a, b) => a + b, 0);
  const before = sum(sides.map((side, index) => worth(side, { ...mine, hand }, index)));
  const perCard = new Map();
  for (const card of new Set(hand)) {
    const rest = [...hand];
    rest.splice(rest.indexOf(card), 1);
    const context = { ...mine, hand: rest };
    const each = sides.map((side, index) => worth(side, context, index));
    perCard.set(card, { context, each, total: sum(each) });
  }
  return ({ card, border }) => {
    const { context, each, total } = perCard.get(card);
    const after = total - each[border] + worth([...sides[border], card], context, border);
    return after - before - cardCost(state.spec, card, mine.params);
  };
}

const winChance = (mine, theirs, params = BOT_PARAMS) => 1 / (1 + Math.exp((theirs - mine) / params.temperature));

/** The view without `card` in hand, built once per card and scoring (`context.memo`). */
function withoutCard(state, context, card) {
  const key = `hand-${card}`;
  const cached = context.memo?.get(key);
  if (cached) return cached;
  const hand = [...state.hands[state.current]];
  hand.splice(hand.indexOf(card), 1);
  const view = { ...context, hand };
  context.memo?.set(key, view);
  return view;
}

function moveGain(state, { card, border }, context, threat) {
  const withHand = withoutCard(state, context, card);
  const side = state.borders[border].sides[state.current];
  const params = context.params ?? BOT_PARAMS;
  const before = winChance(sidePotential(side, withHand), threat, params);
  const after = winChance(sidePotential([...side, card], withHand), threat, params);
  return after - before - cardCost(state.spec, card, params);
}

/** Spending a joker or a high card has a price: keep them for later. */
export function cardCost(spec, card, params = BOT_PARAMS) {
  if (isJoker(card)) return params.jokerCost;
  return (params.cardCost * valueOf(spec, card)) / spec.values;
}

export { VALUE_TO_CHANCE };

/**
 * A strategist that looks ahead (`lookahead.js`): `settings` configure both the
 * strategist that shortlists the moves and the one that plays the rollouts.
 */
const lookaheadOf = (settings, name) => (rng) => {
  const base = strategistBot(rng, settings);
  const policy = (seeded) => strategistBot(seeded, settings);
  return lookaheadBot(rng, { base, policy, ...settings.lookahead, name });
};

/** Bot engines by id. The public line-up (names, versions) is `src/config/bots.js`. */
export const BOTS = Object.freeze({
  random: randomBot,
  greedy: greedyBot,
  strategist: (rng) => strategistBot(rng, { ideas: STRATEGIST_IDEAS, name: "strategist" }),
  // Strategist 1.1 plus look-ahead: the line-up's Stratège 2. Too slow for the report's simulations.
  lookahead: lookaheadOf({ ideas: STRATEGIST_IDEAS }, "lookahead"),
  experimental: lookaheadOf(EXPERIMENT, "experimental"),
  // One habit at a time, to weigh each against the plain greedy bot.
  "strategist:joker": (rng) => strategistBot(rng, { habits: ["joker"] }),
  "strategist:opening": (rng) => strategistBot(rng, { habits: ["opening"] }),
  "strategist:suited": (rng) => strategistBot(rng, { habits: ["suited"] }),
  // Earlier generations, for the report: the three habits alone (1.0), plus the first two ideas (1.1).
  "strategist:habits": (rng) => strategistBot(rng, { name: "strategist:habits" }),
  "strategist:1.1": (rng) => strategistBot(rng, { ideas: ["middle", "spread"], name: "strategist:1.1" }),
  // The three habits plus one idea at a time, to weigh each idea on its own.
  ...Object.fromEntries(IDEAS.map((idea) => [`idea:${idea}`, (rng) => strategistBot(rng, { ideas: [idea], name: `idea:${idea}` })])),
});
