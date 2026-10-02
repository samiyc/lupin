/**
 * The oracle (Sami, 03/10): a tree search over every legal move with a large
 * budget, run on positions of the kept games, to find what the core leaves
 * out. Pure: the search and the replays are `scripts/oracle.js`'s.
 *
 * The 0.9 searches the core's 8 best moves at the root (`candidates`) and its
 * 3 best replies below (`widen`). A gap is the oracle's move outside the
 * core's top 3; outside its top 8, the 0.9 never looks at it at all.
 */
export const ORACLE = Object.freeze({
  engine: "ismcts+candidates=99+widen=6+depth=5",
  budget: 20_000,
  turns: Object.freeze([15, 16, 20, 21, 25, 26]),
  top: 3,
  shortlist: 8,
});

const same = (a, b) => Boolean(a && b) && a.card === b.card && a.border === b.border;

/** The core's moves from best to worst; those its habits refuse come last. */
export function coreRanking(scored) {
  return [...scored].sort((a, b) => Number(Boolean(a.refused)) - Number(Boolean(b.refused)) || b.gain - a.gain).map(({ move }) => move);
}

/** 1 for the core's favourite, and so on. */
export const rankOf = (ranking, move) => ranking.findIndex((other) => same(other, move)) + 1;

/** A search's favourite (gain = visits) and the share of the visits it and the runner-up got. */
export function favouriteOf(scored) {
  const sorted = [...scored].sort((a, b) => b.gain - a.gain);
  const total = sorted.reduce((sum, entry) => sum + entry.gain, 0) || 1;
  return { move: sorted[0].move, share: sorted[0].gain / total, runnerUp: (sorted[1]?.gain ?? 0) / total };
}

/**
 * What one position says: the oracle's favourite in each run, whether the
 * runs agree (`stable`), its rank for the core, and whether it is a gap.
 */
export function verdictOf(ranking, runs) {
  const [first, second] = runs.map(favouriteOf);
  const stable = !second || same(first.move, second.move);
  const rank = rankOf(ranking, first.move);
  return {
    move: first.move,
    share: first.share,
    runnerUp: first.runnerUp,
    stable,
    rank,
    gap: stable && rank > ORACLE.top,
    unseen: stable && rank > ORACLE.shortlist,
  };
}
