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
 * `@N` for a budget of N rollouts (`experimental:0.8-lite@200`).
 */
const FROZEN = {
  // The 0.7, as the page played it until the 0.8 (an ISMCTS, src/sim/ismcts.js).
  "experimental:0.7": EXPERIMENT,
  // Lot 4 of 0.8, set aside: rollouts seeing a lost border at a glance, 53.1 % (47.4-58.8).
  "experimental:0.8-lite": { ...EXPERIMENT, ideas: [...EXPERIMENT.ideas, "certainLite"] },
  // Lot 3 of 0.8, set aside: 47.9 % against 0.7 (docs/strategie.md).
  "experimental:0.8-early": { ...EXPERIMENT, search: { ...EXPERIMENT.search, rolloutMode: "early", exactCards: 9 } },
  "experimental:0.6": { ...EXPERIMENT, search: { ...EXPERIMENT.search, exact: false, rolloutMode: null } },
  "experimental:0.5": { ...EXPERIMENT, ideas: STRATEGIST_IDEAS, search: { ...EXPERIMENT.search, prune: false, exact: false, rolloutMode: null } },
};

/**
 * Changes an engine id may stack on a base with `+key=value`, to screen
 * candidates without freezing each one: `experimental+sample=0.05+prior=0.15`.
 */
const VARIANTS = {
  sample: (settings, value) => ({ ...settings, rolloutSample: Number(value) }),
  prior: (settings, value) => ({ ...settings, search: { ...settings.search, prior: Number(value) } }),
  candidates: (settings, value) => ({ ...settings, search: { ...settings.search, candidates: Number(value) } }),
  lite: (settings) => ({ ...settings, ideas: [...settings.ideas, "certainLite"] }),
  model: (settings, value) => ({ ...settings, search: { ...settings.search, opponentModel: Number(value) } }),
  tries: (settings, value) => ({ ...settings, search: { ...settings.search, modelTries: Number(value) } }),
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
