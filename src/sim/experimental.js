import { IDEA_WEIGHTS, STRATEGIST_IDEAS } from "./ideas.js";
import { SEARCH } from "./search.js";
import { HABITS, STRATEGY } from "./strategist.js";

/**
 * The sandbox bot. It starts as an exact copy of the strategist; an idea is
 * tried by changing it here (and bumping its version in `src/config/bots.js`),
 * then measured with `npm run duel -- experimental stratege`. What wins moves
 * into the strategist, with a new strategist version.
 *
 * Current experiment: the same strategist 1.2 core as Stratège 2.1, with a
 * deeper search (`search.js`): 8 candidates, successive halving, stopped by
 * a rollout budget in duels (`budget`, or `experimental:N` as an engine id)
 * and by a clock in the page, where it also thinks during the human's turn.
 * The ideas it tried before (`ideas.js`, `principles.js`) and what they
 * measured are in docs/strategie.md and docs/analyse-replays.md.
 */
export const EXPERIMENT = Object.freeze({
  habits: HABITS,
  strategy: Object.freeze({ ...STRATEGY }),
  // 0.6: its core also knows which borders are already decided (certainty.js).
  ideas: Object.freeze([...STRATEGIST_IDEAS, "certain"]),
  weights: Object.freeze({ ...IDEA_WEIGHTS }),
  // 0.7: an endgame of 8 cards or fewer, pile empty, is solved exactly (exact.js).
  search: Object.freeze({ ...SEARCH, budget: 400, exact: true }),
});

/**
 * Earlier and candidate versions of the experimental bot, as settings, for
 * duels. Each spells out every setting it differs by, so a later change to
 * EXPERIMENT cannot leak into it. Any of them, and `experimental`, takes
 * `@N` for a budget of N rollouts (`experimental:0.6@200`).
 */
const FROZEN = {
  // The 0.7, as the page played it until the 0.8 (an ISMCTS, src/sim/ismcts.js).
  "experimental:0.7": EXPERIMENT,
  "experimental:0.6": { ...EXPERIMENT, search: { ...EXPERIMENT.search, exact: false } },
};

/**
 * Changes an engine id may stack on a base with `+key=value`, to screen
 * candidates without freezing each one: `experimental+sample=0.05+prior=0.15`.
 */
const VARIANTS = {
  sample: (settings, value) => ({ ...settings, rolloutSample: Number(value) }),
  prior: (settings, value) => ({ ...settings, search: { ...settings.search, prior: Number(value) } }),
  candidates: (settings, value) => ({ ...settings, search: { ...settings.search, candidates: Number(value) } }),
};

function applyVariant(settings, change) {
  const [key, value] = change.split("=");
  if (!Object.hasOwn(VARIANTS, key)) throw new Error(`Variante inconnue : « ${key} »`);
  return VARIANTS[key](settings, value);
}

/** The settings an experimental engine id names — a base, then its `+` variants — or null. */
export function experimentalSettings(name) {
  const [base, ...changes] = name.split("+");
  let settings = null;
  if (Object.hasOwn(FROZEN, base)) settings = FROZEN[base];
  else if (base === "experimental") settings = EXPERIMENT;
  return settings && changes.reduce(applyVariant, settings);
}

/** An engine id's `@` suffix: `@800` for 800 rollouts (or iterations) a move, `@t1500` for 1.5 s a move, whatever that buys. */
export function budgetOf(at) {
  if (at === undefined) return {};
  return at.startsWith("t") ? { budget: Infinity, budgetMs: Number(at.slice(1)) } : { budget: Number(at) };
}

/**
 * Named cores for the tree (`ismcts+core=nb1`, `+shortlist=plain`, `+rollout=plain`)
 * and for core duels (`core:nb1`): the 0.9's core, with neighbours (`neighbors`,
 * ideas.js, λ 1 or 2), with `runs`, or plain — the border odds and the cards'
 * price only, no habit, idea nor certainty: does the bonus steer the search?
 */
export const CORES = Object.freeze({
  exp: EXPERIMENT,
  nb1: { ...EXPERIMENT, ideas: [...EXPERIMENT.ideas, "neighbors"], weights: { ...EXPERIMENT.weights, neighbors: 1 } },
  nb2: { ...EXPERIMENT, ideas: [...EXPERIMENT.ideas, "neighbors"], weights: { ...EXPERIMENT.weights, neighbors: 2 } },
  runs: { ...EXPERIMENT, ideas: [...EXPERIMENT.ideas, "runs"] },
  plain: { ...EXPERIMENT, habits: [], ideas: [] },
  // Sami's first-card ideas (outbid.js), at a few weights: `ob` outbid, `obw` only when outnumbered, `ex` exposure.
  ob1: { ...EXPERIMENT, ideas: [...EXPERIMENT.ideas, "outbid"], weights: { ...EXPERIMENT.weights, outbid: 0.1 } },
  ob2: { ...EXPERIMENT, ideas: [...EXPERIMENT.ideas, "outbid"], weights: { ...EXPERIMENT.weights, outbid: 0.2 } },
  ob4: { ...EXPERIMENT, ideas: [...EXPERIMENT.ideas, "outbid"], weights: { ...EXPERIMENT.weights, outbid: 0.4 } },
  obw2: { ...EXPERIMENT, ideas: [...EXPERIMENT.ideas, "outbid"], weights: { ...EXPERIMENT.weights, outbid: 0.2, outbidWide: 1 } },
  obw4: { ...EXPERIMENT, ideas: [...EXPERIMENT.ideas, "outbid"], weights: { ...EXPERIMENT.weights, outbid: 0.4, outbidWide: 1 } },
  ex1: { ...EXPERIMENT, ideas: [...EXPERIMENT.ideas, "exposure"], weights: { ...EXPERIMENT.weights, exposure: 0.1 } },
  ex2: { ...EXPERIMENT, ideas: [...EXPERIMENT.ideas, "exposure"], weights: { ...EXPERIMENT.weights, exposure: 0.2 } },
  ex4: { ...EXPERIMENT, ideas: [...EXPERIMENT.ideas, "exposure"], weights: { ...EXPERIMENT.weights, exposure: 0.4 } },
  obex: { ...EXPERIMENT, ideas: [...EXPERIMENT.ideas, "outbid", "exposure"], weights: { ...EXPERIMENT.weights, outbid: 0.2, exposure: 0.2 } },
});

export function coreOf(name) {
  if (!Object.hasOwn(CORES, name)) throw new Error(`Cœur inconnu : « ${name} » (connus : ${Object.keys(CORES).join(", ")})`);
  return CORES[name];
}

/**
 * `{ "core:<name>": engine }` for every named core, built by `make(settings)` — as
 * it plays the rollouts, without `certain`: proving certainties on every move
 * makes a core game many times slower, and the rollouts never ran them.
 */
export const coreEngines = (make) =>
  Object.fromEntries(Object.entries(CORES).map(([name, settings]) => [`core:${name}`, make({ ...settings, ideas: settings.ideas.filter((idea) => idea !== "certain"), name: `core:${name}` })]));
