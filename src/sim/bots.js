import { isJoker, valueOf } from "../core/cards.js";
import { createValuer, sidePotential, unseenCards } from "./potential.js";

/**
 * Two players for the simulation.
 *
 * `random` plays any legal card anywhere: it shows what the deck gives when
 * nobody chooses. `greedy` plays the card that most raises its chance of
 * winning one border, measured against what the opponent's side is likely
 * to become. Neither looks ahead; the point is not to play well but to play
 * like someone who builds formations, so the report can count which
 * formations actually get built.
 */
const TEMPERATURE = 0.35;
const JOKER_COST = 0.08;
const CARD_COST = 0.02;

export const randomBot = (rng) => ({
  name: "random",
  choose: (_state, moves) => moves[rng.int(moves.length)],
});

export const greedyBot = (rng) => ({
  name: "greedy",
  choose: (state, moves) => chooseGreedy(state, moves, rng),
});

/** May one more joker join `side`? Asked once per side, not once per card. */
function jokerGate(state, player) {
  const { maxPerSide, maxPerPlayer } = state.jokerRule;
  const underPlayerCap = state.jokersPlayed[player] < maxPerPlayer;
  return (side) => underPlayerCap && side.filter(isJoker).length < maxPerSide;
}

function chooseGreedy(state, moves, rng) {
  const player = state.current;
  const shared = {
    valuer: createValuer(state),
    unseen: unseenCards(state, player),
  };
  const mine = { ...shared, draws: Math.ceil(state.pile.length / 2), jokerAllowed: jokerGate(state, player) };
  // The opponent's hand is unknown: treat it as more draws from the unseen.
  const theirs = {
    ...shared,
    hand: [],
    draws: state.spec.handSize + Math.floor(state.pile.length / 2),
    jokerAllowed: jokerGate(state, 1 - player),
  };
  const threat = state.borders.map((border) => sidePotential(border.sides[1 - player], theirs));
  let best = [];
  let bestGain = -Infinity;
  for (const move of moves) {
    const gain = moveGain(state, move, mine, threat[move.border]);
    if (gain > bestGain + 1e-9) [best, bestGain] = [[move], gain];
    else if (gain > bestGain - 1e-9) best.push(move);
  }
  return best[rng.int(best.length)];
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
function cardCost(spec, card) {
  if (isJoker(card)) return JOKER_COST;
  return (CARD_COST * valueOf(spec, card)) / spec.values;
}

export const BOTS = Object.freeze({ random: randomBot, greedy: greedyBot });
