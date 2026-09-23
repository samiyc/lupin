import { isJoker, valueOf } from "../core/cards.js";
import { createValuer, sidePotential, unseenCards } from "./potential.js";
import { HABITS, strategistMoves } from "./strategist.js";

/**
 * Players for the simulation.
 *
 * `random` plays any legal card anywhere: it shows what the deck gives when
 * nobody chooses. `greedy` plays the card that most raises its chance of
 * winning one border, measured against what the opponent's side is likely
 * to become. `strategist` is `greedy` plus Sami's habits (`strategist.js`).
 * None looks ahead; the point is to play like someone who builds formations,
 * so the report can count which formations actually get built.
 */
const TEMPERATURE = 0.35;
const JOKER_COST = 0.08;
const CARD_COST = 0.02;
/** Slope of the win chance at even odds: value units → win-chance units. */
const VALUE_TO_CHANCE = 1 / (4 * TEMPERATURE);

export const randomBot = (rng) => ({
  name: "random",
  choose: (_state, moves) => moves[rng.int(moves.length)],
});

export const greedyBot = (rng) => ({
  name: "greedy",
  choose: (state, moves) => pickBest(scoreGreedy(state, moves), rng),
});

/** `greedy` plus some of Sami's habits; all three by default. */
export const strategistBot = (rng, habits = HABITS) => {
  const set = new Set(habits);
  return {
    name: habits.length === HABITS.length ? "strategist" : `strategist:${habits.join("+")}`,
    choose: (state, moves) => pickBest(scoreStrategist(state, moves, set), rng),
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

function scoreStrategist(state, moves, habits) {
  const { mine, threat } = views(state);
  const player = state.current;
  const context = {
    spec: state.spec,
    evaluator: state.evaluator,
    unseen: mine.unseen,
    mySides: state.borders.map((border) => border.sides[player]),
    habits,
  };
  return strategistMoves(moves, (move) => state.borders[move.border].sides[player], context, {
    gainOf: (move) => moveGain(state, move, mine, threat[move.border]),
    scale: VALUE_TO_CHANCE,
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

export const BOTS = Object.freeze({
  random: randomBot,
  greedy: greedyBot,
  strategist: (rng) => strategistBot(rng),
  // One habit at a time, to weigh each against the plain greedy bot.
  "strategist:joker": (rng) => strategistBot(rng, ["joker"]),
  "strategist:opening": (rng) => strategistBot(rng, ["opening"]),
  "strategist:suited": (rng) => strategistBot(rng, ["suited"]),
});
