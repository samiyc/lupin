import { DECKS, JOKER_RULES } from "../config/decks.js";
import { FORMATIONS, ORDERS, PATTERNS } from "../config/formations.js";
import { PREVIOUS_BOT, PREVIOUS_BOT_ROWS, REFERENCE_BOT } from "../config/simulations.js";
import { describeDuels, describePlay, describeSolo, playClaims } from "./analysis-play.js";

/**
 * Turns `out/data.json` into the handful of findings the reports tell.
 * Pure: the same data always gives the same findings, and the renderers
 * never compute a number of their own.
 */
export const REFERENCE_SIM = "original-free-original";
export const REFERENCE_MATCHUP = `${REFERENCE_BOT}-${REFERENCE_BOT}`;
export const PREVIOUS_MATCHUP = `${PREVIOUS_BOT}-${PREVIOUS_BOT}`;

/** Share of borders won by the 1st, 2nd … ranked formation, sum last. */
export const rankProfile = (shares, order) => ORDERS[order].map((f) => shares[f]);

/** 1 − total variation distance between two rank profiles: 1 is identical. */
export function resemblance(profile, reference) {
  const distance = profile.reduce((sum, share, i) => sum + Math.abs(share - reference[i]), 0) / 2;
  return 1 - distance;
}

/** The same row as played by the previous reference bot, when it was. */
function previousOf(sim, previousReference) {
  const played = sim[PREVIOUS_MATCHUP];
  if (!played || !previousReference) return null;
  const profile = rankProfile(played.shares.winning, sim.order);
  return {
    profile,
    resemblance: resemblance(profile, previousReference),
    sumShare: played.shares.decidedBy.sum,
    built: played.shares.built,
    jokerEdge: played.shares.jokerEdge,
  };
}

function describeSim(id, sim, { referenceProfile, previousReference }) {
  const shares = sim[REFERENCE_MATCHUP].shares;
  const baseline = sim["random-random"]?.shares;
  const profile = rankProfile(shares.winning, sim.order);
  return {
    id,
    deck: sim.deck,
    jokerRule: sim.jokerRule,
    order: sim.order,
    games: sim[REFERENCE_MATCHUP].games,
    profile,
    builtProfile: rankProfile(shares.built, sim.order),
    built: shares.built,
    winning: shares.winning,
    resemblance: resemblance(profile, referenceProfile),
    sumShare: shares.decidedBy.sum,
    firstShare: shares.decidedBy.first,
    jokerEdge: shares.jokerEdge,
    firstPlayerWins: shares.firstPlayerWins,
    drawShare: shares.endings.draw,
    adjacentShare: shares.endings.adjacent,
    averageTurns: shares.averageTurns,
    randomBuilt: baseline?.built ?? null,
    previous: previousOf(sim, previousReference),
  };
}

/** The most faithful variant of a deck, among those that always produce a winner. */
function mostFaithful(sims, deck) {
  return sims
    .filter((sim) => sim.deck === deck && sim.drawShare < 0.01)
    .sort((a, b) => b.resemblance - a.resemblance)[0];
}

/** Rarity by three lenses for one deck/rule: 3-card hands, 6-card hands, games. */
function lenses(data, deck, rule, sim) {
  const exact = data.exact[deck][rule].original;
  const hand = data.startingHands[deck][rule].complete;
  return {
    triples: { counts: exact.best, total: exact.total },
    hand,
    played: sim ? sim.built : null,
  };
}

const orderFromRarity = (values) =>
  [...PATTERNS].sort((x, y) => values[x] - values[y]);

/** Does rarity, under this lens, rank the patterns the way `order` does? */
export function agreesWith(values, order) {
  const expected = ORDERS[order].filter((f) => f !== "sum");
  return orderFromRarity(values).every((f, i) => f === expected[i]);
}

export function analyze(data) {
  const reference = data.simulations[REFERENCE_SIM];
  const profiles = {
    referenceProfile: rankProfile(reference[REFERENCE_MATCHUP].shares.winning, "original"),
    previousReference: reference[PREVIOUS_MATCHUP] ? rankProfile(reference[PREVIOUS_MATCHUP].shares.winning, "original") : null,
  };
  const sims = Object.entries(data.simulations)
    .filter(([id]) => id !== "sanity")
    .map(([id, sim]) => describeSim(id, sim, profiles));
  const byId = Object.fromEntries(sims.map((sim) => [sim.id, sim]));
  const picks = { classique: mostFaithful(sims, "classique"), tarot: mostFaithful(sims, "tarot") };
  const sanity = data.simulations.sanity;
  return {
    sims,
    byId,
    picks,
    reference: byId[REFERENCE_SIM],
    rapide: byId["rapide-free-original"],
    botWinRate: (sanity[`${REFERENCE_BOT}-random`].shares.firstPlayerWins + sanity[`random-${REFERENCE_BOT}`].shares.secondPlayerWins) / 2,
    duels: describeDuels(data.duels),
    solo: describeSolo(data.solo),
    irl: describePlay(data.irl),
    lenses: {
      original: lenses(data, "original", "free", byId[REFERENCE_SIM]),
      rapide: lenses(data, "rapide", "free", byId["rapide-free-original"]),
      classique: lenses(data, "classique", "free", byId["classique-free-original"]),
      classiqueColorless: lenses(data, "classique", "colorless", byId["classique-colorless-original"]),
      tarot: lenses(data, "tarot", "free", byId["tarot-free-original"]),
      tarotColorless: lenses(data, "tarot", "colorless", byId["tarot-colorless-original"]),
    },
  };
}

/**
 * The reports' prose is written around these outcomes. If a rule change
 * makes the data disagree, the build stops instead of printing a verdict the
 * numbers no longer support.
 */
export function assertNarrative(findings) {
  const check = (condition, message) => {
    if (!condition) throw new Error(`Le récit du rapport ne colle plus aux données : ${message}`);
  };
  const { picks, lenses: l } = findings;
  check(picks.classique.id === "classique-colorless-original", `4 couleurs → ${picks.classique.id}`);
  check(picks.tarot.id === "tarot-colorless-original", `tarot → ${picks.tarot.id}`);
  check(!agreesWith(l.classique.triples.counts, "original"), "le paradoxe du joker libre a disparu");
  check(agreesWith(l.classiqueColorless.triples.counts, "original"), "le joker sans couleur ne rétablit plus l'ordre");
  check(agreesWith(l.original.triples.counts, "original"), "l'original n'est plus cohérent");
  check(findings.byId["classique-onePerPlayer-original"].drawShare > 0.05, "1 joker par joueur ne bloque plus");
  const byId = findings.byId;
  check(byId["classique-colorless-original"].jokerEdge < byId["classique-free-original"].jokerEdge, "le joker sans couleur ne réduit plus l'avantage du joker");
  check(findings.reference.built.flush > findings.reference.built.straight, "dans l'original, la Suite se construit plus que la Couleur");
  check(PREVIOUS_BOT_ROWS.every((id) => byId[id].firstPlayerWins < 0.5), "le premier joueur gagne plus souvent dans le tableau");
  for (const [condition, message] of playClaims(findings)) check(condition, message);
  return findings;
}

export const LABELS = {
  deck: (id) => DECKS[id].label,
  rule: (id) => JOKER_RULES[id].label,
  formations: FORMATIONS,
};
