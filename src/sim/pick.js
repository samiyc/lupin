/** How a bot picks among scored moves (`bots.js`). */

/**
 * A move drawn with probability ∝ exp(gain / `temperature`): rollouts that
 * do not always repeat the core's favourite, so its blind spots do not
 * decide every simulated game the same way.
 */
export function pickSampled(scored, rng, temperature) {
  const top = Math.max(...scored.map(({ gain }) => gain));
  const weights = scored.map(({ gain }) => Math.exp((gain - top) / temperature));
  let draw = rng.next() * weights.reduce((sum, weight) => sum + weight, 0);
  for (const [i, weight] of weights.entries()) {
    draw -= weight;
    if (draw <= 0) return scored[i].move;
  }
  return scored.at(-1).move;
}

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
