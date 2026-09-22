import { isJoker } from "./cards.js";
import {
  classify,
  formationOfScore,
  patternMask,
  strengthScore,
  sumOf,
  sumOfScore,
} from "./formations.js";
import { cardSpace } from "./stand-ins.js";

/**
 * O(1) evaluation of any side of 0-3 cards, through flat tables.
 *
 * The three-card table covers every card id of the space, stand-ins
 * included. A wild slot is then removed by reducing the table over the ids
 * that slot may become: a joker over `space.joker`, an unknown future card
 * over `space.any`. Reductions are max (scores) or OR (masks), both
 * commutative, so the order in which wild slots are reduced does not matter.
 * Same definition as `bestByBruteForce`, which the tests compare it with.
 */
function tableSet(space, leaf, combine) {
  const { m } = space;
  const three = new Int16Array(m * m * m);
  for (let i = 0; i < three.length; i += 1) {
    three[i] = leaf(Math.floor(i / (m * m)), Math.floor(i / m) % m, i % m);
  }
  const memo = new Map([["", three]]);
  const table = (wild) => {
    const key = wild.join(",");
    if (!memo.has(key)) {
      const [first, ...rest] = wild;
      memo.set(key, reduceLastIndex(table(rest), m, space[first], combine));
    }
    return memo.get(key);
  };
  return table;
}

function reduceLastIndex(source, m, [low, high], combine) {
  const out = new Int16Array(source.length / m);
  for (let i = 0; i < out.length; i += 1) {
    let acc = source[i * m + low];
    for (let x = low + 1; x < high; x += 1) acc = combine(acc, source[i * m + x]);
    out[i] = acc;
  }
  return out;
}

function indexOf(real, m) {
  let index = 0;
  for (const card of real) index = index * m + card;
  return index;
}

const cache = new Map();

function memo(key, build) {
  if (!cache.has(key)) cache.set(key, build());
  return cache.get(key);
}

const jokerSlots = (cards) => cards.filter(isJoker).map(() => "joker");
const realOnly = (cards) => cards.filter((card) => !isJoker(card));

/**
 * `score(cards)` for a full side, with jokers resolved at their best under
 * `order` and `jokerRule` (a colourless joker never helps a colour). Scores
 * compare with `>`: higher rank first, then higher sum.
 */
export function getEvaluator(spec, order, jokerRule) {
  const space = cardSpace(spec, jokerRule);
  return memo(`score:${spec.id}:${order.join(",")}:${space.key}`, () => {
    const leaf = (a, b, c) =>
      strengthScore(order, classify(spec, [a, b, c]), sumOf(spec, [a, b, c]));
    const table = tableSet(space, leaf, Math.max);
    const { m } = space;
    const [three, two] = [table([]), table(["joker"])];
    const score = (cards) => table(jokerSlots(cards))[indexOf(realOnly(cards), m)];
    return {
      order,
      score,
      /** Allocation-free path for the simulation's hot loop. */
      score3(a, b, c) {
        if (a >= 0 && b >= 0 && c >= 0) return three[(a * m + b) * m + c];
        if (a >= 0 && b >= 0) return two[a * m + b];
        return score([a, b, c]);
      },
      formation: (cards) => formationOfScore(order, score(cards)),
      sum: (cards) => sumOfScore(score(cards)),
    };
  });
}

/**
 * `mask(cards)` for 0-3 cards: every pattern the side could show once
 * finished. Jokers are resolved as the rule allows; missing cards up to three
 * are "any real card still to come". On two cards it answers "which
 * formations is this pair a start of?". Independent of the order.
 */
export function getReachability(spec, jokerRule) {
  const space = cardSpace(spec, jokerRule);
  return memo(`reach:${spec.id}:${space.key}`, () => {
    const table = tableSet(space, (a, b, c) => patternMask(spec, [a, b, c]), (x, y) => x | y);
    const mask = (cards) => {
      const missing = Array(3 - cards.length).fill("any");
      return table([...jokerSlots(cards), ...missing])[indexOf(realOnly(cards), space.m)];
    };
    return { mask };
  });
}
