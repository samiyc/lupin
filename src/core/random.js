/**
 * Seeded PRNG (mulberry32). Every random draw in the project goes through
 * here, so a build with the same seed reproduces the same numbers.
 */
export function createRng(seed) {
  let state = seed >>> 0;
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (n) => Math.floor(next() * n);
  return {
    next,
    int,
    /** In-place Fisher-Yates; returns the array for chaining. */
    shuffle(array) {
      for (let i = array.length - 1; i > 0; i -= 1) {
        const j = int(i + 1);
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    },
  };
}
