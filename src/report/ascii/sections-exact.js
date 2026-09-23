import { FORMATIONS, ORDERS, PATTERNS } from "../../config/formations.js";
import { agreesWith } from "../analysis.js";
import { COLUMNS, label } from "../columns.js";
import { int, pct, smartPct } from "../format.js";
import { box, cards, fence, padEnd, table } from "./toolkit.js";

const tick = (ok) => (ok ? "✓" : "✗");
const heads = (first) => [first, ...COLUMNS.map((c) => `${c.head} ${c.sub}`)];

export function verdict(f) {
  const ratio = (f.byId["classique-free-original"].profile[0] / f.reference.profile[0]).toFixed(1).replace(".", ",");
  const lines = [
    "♠ 4 couleurs × 1-10 + 2 jokers : OUI, à une condition —",
    "  le joker vaut le chiffre qu'on veut, mais n'a PAS de couleur.",
    "♥ Avec cette règle, l'ordre d'origine reste juste : rien à réordonner.",
    `♦ Ressemblance avec l'original : ${pct(f.picks.classique.resemblance)}, la plus haute de toutes`,
    `  les variantes (ta version rapide : ${pct(f.rapide.resemblance)}, le tarot : ${pct(f.picks.tarot.resemblance)}).`,
    "♣ Avec un joker « libre », aucun ordre ne tient et la Suite couleur",
    `  gagne ${ratio} fois plus de bornes que dans l'original. À éviter.`,
    `★ Tes ${f.irl.columns} colonnes jouées pour de vrai confirment le tableau. Tes habitudes`,
    `  et tes idées rendent le robot plus fort : ${pct(f.duels.strategist.rate, 0)} de victoires contre l'ancien.`,
  ];
  return ["## Le verdict", "", ...fence(box(lines, { title: "LE VERDICT", inner: 70 })), ""];
}

const EXAMPLES = [
  ["straightFlush", [["4", "♥"], ["5", "♥"], ["6", "♥"]], "trois cartes qui se suivent, de la même couleur"],
  ["threeOfAKind", [["7", "♠"], ["7", "♥"], ["7", "♦"]], "trois cartes de même valeur"],
  ["flush", [["2", "♣"], ["5", "♣"], ["9", "♣"]], "trois cartes de la même couleur"],
  ["straight", [["8", "♠"], ["9", "♥"], ["10", "♦"]], "trois cartes qui se suivent"],
  ["sum", [["3", "♦"], ["7", "♠"], ["10", "♥"]], "tout le reste : on additionne (ici 20)"],
];

export function formations() {
  const rows = EXAMPLES.flatMap(([formation, hand, text], i) => {
    const drawn = cards(hand.map(([value, suit]) => ({ label: value, suit })));
    const side = [`${i + 1}. ${label(formation).toUpperCase()}`, text, "", ""];
    return [...drawn.map((line, j) => `${line}   ${side[j]}`.trimEnd()), ""];
  });
  return [
    "## Les cinq combinaisons, de la plus forte à la plus faible",
    "",
    "Les règles d'origine, sur un jeu de 52 cartes. En cas d'égalité de combinaison,",
    "la plus grosse somme gagne ; si l'égalité persiste, celui qui a fini sa ligne le premier.",
    "",
    ...fence(rows.slice(0, -1)),
    "",
  ];
}

function rarityTable(f) {
  const count = (c) => f.lenses[c.key].triples;
  const rows = FORMATIONS.map((formation) => [
    label(formation),
    ...COLUMNS.map((c) => smartPct(count(c).counts[formation] / count(c).total)),
  ]);
  rows.push(["Mains possibles", ...COLUMNS.map((c) => int(count(c).total))]);
  rows.push(["Ordre respecté ?", ...COLUMNS.map((c) => tick(agreesWith(count(c).counts, "original")))]);
  return table(heads("3 cartes au hasard"), rows, ["left", ...COLUMNS.map(() => "right")]);
}

function ladder(title, counts, total) {
  const rare = [...PATTERNS].sort((x, y) => counts[x] - counts[y]);
  return [
    padEnd(title, 30),
    ...rare.map((formation, i) => {
      const ok = ORDERS.original.indexOf(formation) === i;
      return padEnd(`${i + 1}. ${padEnd(label(formation), 14)}${padEnd(smartPct(counts[formation] / total), 7)} ${tick(ok)}`, 30);
    }),
  ];
}

function ladders(f) {
  const pick = [
    ["ORIGINAL 6×9", f.lenses.original],
    ["4 COUL., JOKER LIBRE", f.lenses.classique],
    ["4 COUL., JOKER SANS COULEUR", f.lenses.classiqueColorless],
  ].map(([title, lens]) => ladder(title, lens.triples.counts, lens.triples.total));
  return pick[0].map((_, i) => pick.map((column) => column[i]).join("  ")).map((l) => l.trimEnd());
}

export function triples(f, data) {
  const free = data.exact.classique.free;
  const [a, b] = [free.original.best, free.swapped.best];
  const cl = data.exact.classique.colorless.original.best;
  const paradox = [
    `Ordre d'origine : Suite couleur ${a.straightFlush} mains, Brelan ${a.threeOfAKind} mains.`,
    "  → le Brelan est le plus rare : il devrait passer devant.",
    `On les échange  : Suite couleur ${b.straightFlush} mains, Brelan ${b.threeOfAKind} mains.`,
    "  → les mains à 2 jokers deviennent des Brelans : il redevient le plus courant.",
    "Aucun ordre ne tient. C'est le paradoxe des jokers, connu au poker",
    "(Gadbois, Mathematics Magazine, 1996).",
    "",
    `Joker sans couleur : ${cl.straightFlush} / ${cl.threeOfAKind} / ${int(cl.flush)} / ${int(cl.straight)} mains,`,
    "quel que soit l'ordre choisi. Il ne peut plus faire de couleur,",
    "donc la Suite couleur redevient rare et l'ordre d'origine tient.",
  ];
  return [
    "## Premier angle : trois cartes tirées au hasard",
    "",
    "Toutes les mains de 3 cartes possibles, comptées une par une (calcul exact, pas un",
    "sondage). Une combinaison forte doit être rare : c'est la logique des règles d'origine.",
    "",
    ...fence(rarityTable(f)),
    "",
    "Du plus rare au plus courant — ✓ quand la place correspond à l'ordre des règles :",
    "",
    ...fence(ladders(f)),
    "",
    ...fence(box(paradox, { title: "LE PARADOXE DU JOKER LIBRE (4 couleurs)", inner: 76 })),
    "",
    tarotNote(f),
    "",
  ];
}

function tarotNote(f) {
  const { counts, total } = f.lenses.tarotColorless.triples;
  return [
    `En tarot, le joker sans couleur a un petit défaut au tirage de 3 cartes : le Brelan`,
    `(${smartPct(counts.threeOfAKind / total)}) y devient à peine plus courant que la Couleur (${smartPct(counts.flush / total)}). Les deux`,
    "angles suivants, plus proches du jeu réel, montrent que l'ordre tient quand même.",
  ].join("\n");
}

export function startingHand(f) {
  const rows = PATTERNS.map((formation) => [
    label(formation),
    ...COLUMNS.map((c) => pct(f.lenses[c.key].hand[formation])),
  ]);
  rows.push(["Ordre respecté ?", ...COLUMNS.map((c) => tick(agreesWith(f.lenses[c.key].hand, "original")))]);
  const cl = f.lenses.classique.hand;
  return [
    "## Deuxième angle : la main de départ (6 cartes)",
    "",
    "Probabilité que les 6 cartes reçues contiennent déjà la combinaison complète.",
    "C'est plus proche du jeu réel : on choisit ses 3 cartes parmi 6.",
    "",
    ...fence(table(heads("Déjà en main"), rows, ["left", ...COLUMNS.map(() => "right")])),
    "",
    `En 4 couleurs avec joker libre, la Couleur (${pct(cl.flush)}) devient plus courante que la`,
    `Suite (${pct(cl.straight)}) : six cartes pour quatre couleurs, il y en a forcément plusieurs`,
    "de la même. Le joker sans couleur remet les choses dans l'ordre.",
    "",
  ];
}

export function outs(data) {
  const rows = data.outs.original.free.map((row, i) => [
    row.label,
    ...COLUMNS.map((c) => {
      const cell = data.outs[c.deck][c.rule][i];
      return cell.jokers ? `${cell.real} + ${cell.jokers} J` : String(cell.real);
    }),
  ]);
  return [
    "## Troisième angle : les cartes qui complètent",
    "",
    "Vous avez posé deux cartes : combien de cartes du paquet terminent la combinaison ?",
    "(« J » = jokers qui conviennent aussi.)",
    "",
    ...fence(table(heads("Deux cartes posées"), rows, ["left", ...COLUMNS.map(() => "right")])),
    "",
    "Une paire n'a plus que 2 cartes pour devenir Brelan en 4 couleurs, contre 4 dans",
    "l'original : c'est pour ça que le Brelan recule. Le joker sans couleur aide le Brelan",
    "et la Suite, jamais la Couleur.",
    "",
  ];
}
