import { DUEL_CHALLENGERS } from "../config/simulations.js";
import { FORMATIONS } from "../config/formations.js";
import { wilson } from "../irl/analysis.js";

/**
 * Findings about how people and bots play: Sami's real games, the bots on
 * his solo protocol, and the duels between bots. Pure, like `analysis.js`.
 */
const sumOf = (counts) => Object.values(counts).reduce((a, b) => a + b, 0);

function sharesWithInterval(counts) {
  const total = sumOf(counts);
  return Object.fromEntries(
    FORMATIONS.map((f) => {
      const [low, high] = wilson(counts[f], total);
      return [f, { count: counts[f], share: total ? counts[f] / total : 0, low, high }];
    }),
  );
}

const addCounts = (a, b) => Object.fromEntries(FORMATIONS.map((f) => [f, a[f] + b[f]]));

/** A solo tally (real or simulated) as shares per line, jokers and optimum. */
export function describePlay(tally) {
  const all = addCounts(tally.lines.haut, tally.lines.bas);
  const lines = 2 * tally.games;
  return {
    games: tally.games,
    lines,
    columns: sumOf(all),
    all: sharesWithInterval(all),
    haut: sharesWithInterval(tally.lines.haut),
    bas: sharesWithInterval(tally.lines.bas),
    jokers: { counts: tally.jokers, total: sumOf(tally.jokers) },
    valuePerLine: (tally.value.haut + tally.value.bas) / lines,
    optimum: {
      lines: tally.optimum.lines,
      ratio: tally.optimum.optimum ? tally.optimum.value / tally.optimum.optimum : null,
    },
  };
}

/** Each challenger's win rate against the previous bot, both seats pooled. */
export function describeDuels(duels) {
  return Object.fromEntries(
    DUEL_CHALLENGERS.map((id) => {
      const { first, second } = duels[id];
      const games = first.games + second.games;
      const wins = first.wins[0] + second.wins[1];
      const [low, high] = wilson(wins, games);
      return [id, { games, wins, rate: wins / games, low, high }];
    }),
  );
}

const overlaps = (a, b) => a.low <= b.high && b.low <= a.high;

/**
 * What the prose about real games, solo bots and duels claims, as
 * `[condition, message]` pairs for `assertNarrative`.
 */
export function playClaims(f) {
  const bot = f.solo["solo-classique-strategist"];
  const rapide = f.solo["solo-rapide-strategist"];
  const human = f.irl;
  const faithful = f.sims.filter((sim) => sim.id !== "original-free-original" && sim.drawShare < 0.01);
  const topFaithful = faithful.reduce((a, b) => (b.resemblance > a.resemblance ? b : a));
  return [
    [topFaithful.id === f.picks.classique.id, `la variante la plus fidèle est ${topFaithful.id}`],
    [Object.values(f.duels).every((duel) => duel.low > 0.5), "une habitude ne bat plus l'ancien robot"],
    [human.all.straightFlush.low > bot.all.straightFlush.share, "tes Suites couleur ne dépassent plus le robot"],
    [human.all.sum.share < bot.all.sum.share, "tu ne fais plus moins de Sommes que le robot"],
    [human.optimum.ratio > bot.optimum.ratio, "le robot approche mieux l'optimum que toi"],
    [human.jokers.counts.threeOfAKind === human.jokers.total, "un de tes jokers n'a pas fait de Brelan"],
    [FORMATIONS.every((f_) => overlaps(human.haut[f_], human.bas[f_])), "haut et bas diffèrent au-delà du bruit"],
    [bot.all.flush.share > rapide.all.flush.share, "la Couleur n'est plus plus présente en 4 couleurs"],
    [rapide.all.threeOfAKind.share > bot.all.threeOfAKind.share, "le Brelan n'est plus plus présent en rapide"],
    [Math.abs(bot.all.straightFlush.share - rapide.all.straightFlush.share) < 0.03, "les Suites couleur diffèrent entre 4 couleurs et rapide"],
  ];
}

export function describeSolo(solo) {
  return Object.fromEntries(Object.entries(solo).map(([id, tally]) => [id, { ...describePlay(tally), deck: tally.deck, bot: tally.bot }]));
}
