import { FORMATIONS } from "../config/formations.js";
import { JOKER, isJoker, realCardCount } from "./cards.js";
import {
  classify,
  formationOfScore,
  patternMask,
  strengthScore,
  sumOf,
  sumOfScore,
} from "./formations.js";

/**
 * O(1) evaluation of any side of 0-3 cards, through flat tables indexed by
 * real card. A joker is resolved by maximising over every real card, so the
 * two-card table is the three-card table maximised over its last index, and
 * so on down. Same definition as `bestByBruteForce`, which the tests compare
 * it with, cell by cell.
 */
function buildTables(n, leaf, combine) {
  const three = new Int16Array(n * n * n);
  for (let i = 0; i < three.length; i += 1) {
    three[i] = leaf(Math.floor(i / (n * n)), Math.floor(i / n) % n, i % n);
  }
  const two = reduceLastIndex(three, n, n * n, combine);
  const one = reduceLastIndex(two, n, n, combine);
  const none = reduceLastIndex(one, n, 1, combine);
  return [none, one, two, three];
}

function reduceLastIndex(table, n, size, combine) {
  const out = new Int16Array(size);
  for (let i = 0; i < size; i += 1) {
    let acc = table[i * n];
    for (let x = 1; x < n; x += 1) acc = combine(acc, table[i * n + x]);
    out[i] = acc;
  }
  return out;
}

function lookup(tables, n, cards) {
  const real = cards.filter((card) => !isJoker(card));
  const table = tables[real.length];
  let index = 0;
  for (const card of real) index = index * n + card;
  return table[index];
}

const cache = new Map();

function memo(key, build) {
  if (!cache.has(key)) cache.set(key, build());
  return cache.get(key);
}

/**
 * `score(cards)` for a full side, with jokers resolved at their best under
 * `order`. Scores compare with `>`: higher rank first, then higher sum.
 */
export function getEvaluator(spec, order) {
  return memo(`score:${spec.id}:${order.join(",")}`, () => {
    const n = realCardCount(spec);
    const leaf = (a, b, c) =>
      strengthScore(order, classify(spec, [a, b, c]), sumOf(spec, [a, b, c]));
    const tables = buildTables(n, leaf, Math.max);
    const score = (cards) => lookup(tables, n, cards);
    return {
      order,
      score,
      formation: (cards) => formationOfScore(order, score(cards)),
      sum: (cards) => sumOfScore(score(cards)),
    };
  });
}

/**
 * `mask(cards)` for 0-3 cards: every pattern the side could still show once
 * completed with any card(s) — joker slots included. Independent of the order.
 * On two cards it answers "which formations is this pair a start of?".
 */
export function getReachability(spec) {
  return memo(`reach:${spec.id}`, () => {
    const n = realCardCount(spec);
    const leaf = (a, b, c) => patternMask(spec, [a, b, c]);
    const tables = buildTables(n, leaf, (x, y) => x | y);
    const mask = (cards) => lookup(tables, n, [...cards, ...padding(cards)]);
    return { mask };
  });
}

/** Missing cards up to three count as jokers: "completed with anything". */
function padding(cards) {
  return Array(Math.max(0, 3 - cards.length)).fill(JOKER);
}

export const ALL_PATTERNS_MASK = FORMATIONS.reduce((mask, _, i) => mask | (1 << i), 0);
