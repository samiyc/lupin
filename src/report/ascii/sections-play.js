import { ORDER_IDS, ORDER_LABELS } from "../../config/formations.js";
import { PROFILE_ROWS, RANK_NAMES, label } from "../columns.js";
import { int, pct } from "../format.js";
import { bar, box, fence, padEnd, padStart, stacked, table } from "./toolkit.js";

const FILLS = ["█", "▓", "▒", "░", "·"];
const LEGEND = FILLS.map((fill, i) => fill + fill + " " + RANK_NAMES[i]).join("   ");

function profileChart(f) {
  const rows = PROFILE_ROWS.map(({ id, label: name }) => {
    const sim = f.byId[id];
    return `${padEnd(name, 24)} ${stacked(sim.profile, FILLS, 40)}  ${padStart(pct(sim.resemblance), 7)}`;
  });
  return [`${padEnd("", 24)} ${padEnd("Bornes gagnées, par rang de la combinaison", 40)}  Ressemb.`, ...rows, "", LEGEND];
}

function statsTable(f) {
  const rows = PROFILE_ROWS.map(({ id, label: name }) => {
    const sim = f.byId[id];
    return [
      name,
      pct(sim.resemblance),
      sim.previous ? pct(sim.previous.resemblance) : "—",
      pct(sim.sumShare),
      sim.jokerEdge === null ? "—" : pct(sim.jokerEdge),
      pct(1 - sim.firstPlayerWins - sim.drawShare),
      sim.averageTurns.toFixed(1).replace(".", ","),
    ];
  });
  return table(
    ["Variante", "Ressemb.", "Ancien robot", "Bornes à la somme", "Plus de jokers gagne", "2e joueur gagne", "Cartes posées"],
    rows,
    ["left", "right", "right", "right", "right", "right", "right"],
  );
}

export function simulation(f, data) {
  const ref = f.reference;
  const random = f.byId["classique-free-original"].randomBuilt;
  const exact = data.exact.classique.free.original;
  return [
    "## Quatrième angle : des parties entières, jouées par des robots",
    "",
    `${int(data.sizes.games)} parties par variante entre deux robots « stratèges » : chacun pose la carte`,
    "qui augmente le plus ses chances de gagner une borne, face à ce que l'adversaire",
    "est en train de construire, et suit en plus tes trois habitudes (voir plus bas).",
    "La colonne « Ancien robot » donne la ressemblance obtenue avec la première version,",
    "sans tes habitudes. Deux vérifications avant de croire ces parties :",
    "",
    `- le robot stratège bat un robot qui joue au hasard dans ${pct(f.botWinRate)} des parties ;`,
    "- deux robots au hasard retrouvent les probabilités exactes du premier angle",
    `  (Suite couleur ${pct(random.straightFlush)} en jeu, ${pct(exact.best.straightFlush / exact.total)} au calcul).`,
    "",
    "**Même dans l'original, en jeu, la Couleur se construit plus souvent que la Suite**",
    `(${pct(ref.built.flush)} contre ${pct(ref.built.straight)}) : on court après ce qui rapporte. Les parties ne`,
    "servent donc pas à classer les combinaisons, mais à mesurer si le jeu *ressemble* à",
    "l'original : on compare, rang par rang, la part des bornes gagnées par la 1re",
    "combinaison de l'ordre, la 2e, etc. 100 % = même profil que l'original.",
    "",
    ...fence(profileChart(f)),
    "",
    ...fence(statsTable(f)),
    "",
    `Le second joueur gagne un peu plus souvent dans toutes les variantes du tableau, original`,
    `compris (${pct(ref.firstPlayerWins)} pour le premier) : c'est le jeu, pas les cartes. Le joueur qui a posé le plus de`,
    "jokers gagne souvent : 2 jokers sur 42 cartes pèsent lourd. Le joker sans couleur",
    "réduit cet avantage.",
    "",
  ];
}

const points = (f) =>
  Math.round(100 * (f.byId["classique-colorless-original"].resemblance - f.byId["classique-colorless-swapped"].resemblance));

/** The best a 4-colour variant does without the colourless joker, any order. */
export const bestWithoutColorless = (f) =>
  Math.max(...f.sims.filter((sim) => sim.deck === "classique" && sim.jokerRule !== "colorless" && sim.drawShare < 0.01).map((sim) => sim.resemblance));

export function variants(f) {
  const rules = [["free", "Joker libre"], ["onePerBorder", "1 joker par borne"], ["colorless", "Joker sans couleur"]];
  const best = f.picks.classique.id;
  const rows = rules.map(([rule, name]) => [
    name,
    ...ORDER_IDS.map((order) => {
      const sim = f.byId[`classique-${rule}-${order}`];
      return `${sim.id === best ? "★ " : ""}${pct(sim.resemblance)}`;
    }),
  ]);
  const ones = f.byId["classique-onePerPlayer-original"];
  return [
    "## Toutes les variantes testées en 4 couleurs",
    "",
    "Ressemblance avec l'original, pour chaque règle de joker et chaque ordre :",
    "",
    ...fence(table(["", ...ORDER_IDS.map((o) => ORDER_LABELS[o])], rows, ["left", "right", "right", "right", "right"])),
    "",
    `Aucun ordre ne rattrape un joker libre : le meilleur plafonne à ${pct(bestWithoutColorless(f))}. C'est la`,
    "règle du joker qui fait la différence. Et avec le joker sans couleur, échanger Brelan",
    `et Suite couleur coûte ${points(f)} points : gardez l'ordre d'origine.`,
    "",
    `Et « 1 joker maximum par joueur » ? Le second joker reste coincé en main : ${pct(ones.drawShare)}`,
    "des parties se terminent sans vainqueur. À éviter.",
    "",
  ];
}

export function recommendation(f) {
  const pick = f.picks.classique;
  const order = ["straightFlush", "threeOfAKind", "flush", "straight", "sum"].map(label).join(" > ");
  const lines = [
    "Paquet   52 cartes sans Valets, Dames ni Rois (As = 1), + les 2 jokers = 42",
    "Joker    vaut le chiffre de votre choix, mais n'a pas de couleur",
    `Ordre    ${order}`,
    "Partie   7 bornes · 6 cartes en main · 4 bornes, ou 3 côte à côte, pour gagner",
    "Conseil  gardez le joker pour un Brelan",
    "",
    `Ressemblance avec l'original ${bar(pick.resemblance, 1, 30)} ${pct(pick.resemblance)}`,
  ];
  return ["## La règle retenue", "", ...fence(box(lines, { title: "4 COULEURS · JOKER SANS COULEUR", inner: 78 })), ""];
}

export function method(data) {
  return [
    "## Comment c'est calculé",
    "",
    "- Mains de 3 cartes : **toutes** comptées (calcul exact). Un joker prend la meilleure",
    "  valeur possible pour sa ligne.",
    `- Mains de départ : ${int(data.sizes.startingHands)} mains de 6 tirées au hasard par paquet.`,
    `- Parties : ${int(data.sizes.games)} par variante, robot stratège contre robot stratège, graine ${data.seed}`,
    "  (rejouable à l'identique).",
    `- Tes parties réelles : transcrites photo par photo ; chaque photo contient bien les 42 cartes.`,
    `  Les robots rejouent ton protocole solo ${int(data.sizes.soloGames)} fois ; le meilleur rangement possible`,
    "  d'une ligne est calculé exactement (programmation dynamique sur les 21 cartes).",
    "- Simplification : une borne se règle quand les deux côtés ont 3 cartes. La",
    "  revendication anticipée (« je prouve que tu ne peux plus me battre ») n'est pas simulée ;",
    "  elle change le moment où l'on gagne une borne, pas les combinaisons que l'on construit.",
    "",
    "Détails et limites : `docs/methode.md`. Tout se recalcule avec `npm run build`.",
    "",
  ];
}
