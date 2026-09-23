import { getEvaluator } from "./evaluator.js";

/**
 * The best way to split a set of cards (a multiple of three, at most 21) into
 * trios. A trio is worth its formation's rank — 4 for the top of the order,
 * 0 for a sum — plus its sum as a fraction, so a better formation always
 * outweighs a better sum. That is the scale the bots' valuer uses too.
 *
 * Dynamic programming over subsets: `best[mask]` is the best value of the
 * cards in `mask`. The lowest card of a mask has to go somewhere, so only the
 * pairs that join it are tried. 2^21 masks, about 30 million steps: well
 * under a second.
 */
export function trioValue(evaluator, spec) {
  const scale = 3 * spec.values + 1;
  return (a, b, c) => {
    const score = evaluator.score3(a, b, c);
    return Math.floor(score / 64) + (score % 64) / scale;
  };
}

function trioTable(cards, value) {
  const n = cards.length;
  const table = new Float64Array(n * n * n);
  for (let i = 0; i < n; i += 1) {
    for (let j = i + 1; j < n; j += 1) {
      for (let k = j + 1; k < n; k += 1) table[(i * n + j) * n + k] = value(cards[i], cards[j], cards[k]);
    }
  }
  return table;
}

const popcount = (mask) => {
  let count = 0;
  for (let m = mask; m; m &= m - 1) count += 1;
  return count;
};

/** Writes the set bits of `mask` into `bits` (reused, no allocation); returns how many. */
function bitsInto(mask, n, bits) {
  let count = 0;
  for (let i = 0; i < n; i += 1) {
    if ((mask >> i) & 1) {
      bits[count] = i;
      count += 1;
    }
  }
  return count;
}

function bestForMask(mask, n, { table, best, bits }) {
  const count = bitsInto(mask, n, bits);
  const low = bits[0];
  let top = -Infinity;
  let pick = 0;
  for (let a = 1; a < count; a += 1) {
    for (let b = a + 1; b < count; b += 1) {
      const [j, k] = [bits[a], bits[b]];
      const total = table[(low * n + j) * n + k] + best[mask & ~(1 << low) & ~(1 << j) & ~(1 << k)];
      if (total > top) [top, pick] = [total, j * 32 + k];
    }
  }
  return [top, pick];
}

function rebuild(cards, choice, full) {
  const trios = [];
  for (let mask = full; mask; ) {
    const low = 31 - Math.clz32(mask & -mask);
    const [j, k] = [choice[mask] >> 5, choice[mask] & 31];
    trios.push([cards[low], cards[j], cards[k]]);
    mask &= ~(1 << low) & ~(1 << j) & ~(1 << k);
  }
  return trios;
}

/** `{ total, trios }` for `cards` under `order` and `jokerRule`. */
export function bestPartition(spec, cards, { order, jokerRule }) {
  const n = cards.length;
  if (n % 3 !== 0 || n > 21) throw new Error(`bestPartition : ${n} cartes, il en faut 3k ≤ 21`);
  const table = trioTable(cards, trioValue(getEvaluator(spec, order, jokerRule), spec));
  const full = (1 << n) - 1;
  const best = new Float64Array(full + 1);
  const choice = new Uint16Array(full + 1);
  const work = { table, best, bits: new Int8Array(n) };
  for (let mask = 1; mask <= full; mask += 1) {
    if (popcount(mask) % 3 !== 0) continue;
    [best[mask], choice[mask]] = bestForMask(mask, n, work);
  }
  return { total: best[full], trios: rebuild(cards, choice, full) };
}
