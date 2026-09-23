import { FORMATIONS } from "../../config/formations.js";
import { label } from "../columns.js";
import { int, pct } from "../format.js";
import { fence, table } from "./toolkit.js";

/**
 * The real games (`data/irl/essais.json`) against the bots replaying the
 * same solo protocol, and Sami's habits measured inside the bot.
 */
const SOLO_CLASSIQUE = "solo-classique-strategist";
const SOLO_GREEDY = "solo-classique-greedy";
const SOLO_RAPIDE = "solo-rapide-strategist";
const RIGHT = ["left", "right", "right", "right", "right", "right", "right"];

function comparisonTable(f) {
  const exact = f.lenses.classiqueColorless.triples;
  const twoPlayer = f.byId["classique-colorless-original"].built;
  const rows = FORMATIONS.map((formation) => {
    const human = f.irl.all[formation];
    return [
      label(formation),
      pct(human.share),
      `${pct(human.low, 0)} – ${pct(human.high, 0)}`,
      pct(f.solo[SOLO_CLASSIQUE].all[formation].share),
      pct(f.solo[SOLO_GREEDY].all[formation].share),
      pct(twoPlayer[formation]),
      pct(exact.counts[formation] / exact.total),
    ];
  });
  return table(
    ["Combinaison", "Toi", "Ta fourchette", "Stratège seul", "Gourmand seul", "Partie à deux", "3 au hasard"],
    rows,
    RIGHT,
  );
}

function linesTable(f) {
  const solo = f.solo[SOLO_CLASSIQUE];
  const rows = ["straightFlush", "threeOfAKind", "flush", "sum"].map((formation) => [
    label(formation),
    pct(f.irl.haut[formation].share),
    pct(f.irl.bas[formation].share),
    pct(solo.haut[formation].share),
    pct(solo.bas[formation].share),
  ]);
  return table(["Combinaison", "Toi, haut", "Toi, bas", "Robot, haut", "Robot, bas"], rows, RIGHT);
}

function feelingTable(f) {
  const [classique, rapide] = [f.solo[SOLO_CLASSIQUE], f.solo[SOLO_RAPIDE]];
  const rows = ["straightFlush", "threeOfAKind", "flush"].map((formation) => [
    label(formation),
    pct(classique.all[formation].share),
    pct(rapide.all[formation].share),
  ]);
  return table(["Robot stratège, seul", "4 couleurs + joker", "Rapide 6×7"], rows, RIGHT);
}

function takeaways(f) {
  const human = f.irl;
  const bot = f.solo[SOLO_CLASSIQUE];
  const sf = human.all.straightFlush;
  const botJokers = bot.jokers.counts.threeOfAKind / bot.jokers.total;
  return [
    `- **Tu fais bien plus de Suites couleur que le robot** : ${pct(sf.share)} de tes colonnes (ta`,
    `  fourchette à 95 % va de ${pct(sf.low, 0)} à ${pct(sf.high, 0)}), contre ${pct(bot.all.straightFlush.share)} pour le robot stratège. Moins de`,
    `  Sommes aussi : ${pct(human.all.sum.share)} contre ${pct(bot.all.sum.share)}.`,
    `- **Tu joues mieux que lui.** Avec les mêmes 21 cartes, le meilleur rangement possible (calculé`,
    `  exactement) vaut 100 : tu atteins ${pct(human.optimum.ratio, 0)}, le robot ${pct(bot.optimum.ratio, 0)}.`,
    `- **Tes ${human.jokers.total} jokers ont tous fini en Brelan** ; ceux du robot stratège aussi, à ${pct(botJokers, 0)}.`,
    "- Les chiffres de la partie à deux ne sont pas comparables tels quels : là, on joue contre",
    "  quelqu'un, et une borne perdue n'appelle plus de belles cartes.",
  ];
}

export function realGames(f) {
  const human = f.irl;
  const bot = f.solo[SOLO_CLASSIQUE];
  return [
    "## Cinquième angle : tes parties en vrai",
    "",
    `${human.games} photos, ${human.columns} colonnes de 3 cartes, jouées seul avec le jeu de 52 cartes et le`,
    "joker sans couleur (transcription : `data/irl/essais.json`). Pour comparer ce qui est",
    "comparable, les robots ont rejoué **le même protocole** : une moitié de 21 cartes, main de",
    "6, sept colonnes, personne à battre ; la ligne du haut à l'aveugle, celle du bas en",
    `voyant l'autre moitié (${int(bot.games)} parties par robot).`,
    "",
    ...fence(comparisonTable(f)),
    "",
    ...takeaways(f),
    "",
    "Ligne du haut (à l'aveugle) et ligne du bas (en voyant l'autre moitié) :",
    "",
    ...fence(linesTable(f)),
    "",
    `Avec ${human.games} lignes de chaque sorte (${human.columns / 2} colonnes), tes écarts entre haut et bas restent`,
    "dans le bruit : les fourchettes se recouvrent.",
    "",
    "**Ton impression, vérifiée par le robot sur le même protocole :**",
    "",
    ...fence(feelingTable(f)),
    "",
    "La Couleur est bien plus présente en 4 couleurs, et le Brelan en version rapide : c'est",
    "confirmé. Les Suites couleur, elles, sortent à peu près autant dans les deux : si elles te",
    "semblent plus faciles ici, c'est sans doute ta façon de jouer, pas le paquet.",
    "",
  ];
}

const HABIT_LABELS = {
  "strategist:joker": "Garder le joker pour un Brelan",
  "strategist:opening": "Ouvrir au milieu, une couleur à la fois",
  "strategist:suited": "Suite couleur plutôt que paire",
  "strategist:habits": "Les trois ensemble",
  strategist: "Les trois, plus tes deux idées",
};

export function strategies(f) {
  const rows = Object.entries(HABIT_LABELS).map(([id, name]) => {
    const duel = f.duels[id];
    return [name, pct(duel.rate), `${pct(duel.low)} – ${pct(duel.high)}`, int(duel.games)];
  });
  return [
    "## Tes stratégies dans le robot",
    "",
    "Chaque habitude a été ajoutée seule, puis les trois ensemble, puis deux de tes idées tirées",
    "des parties contre les robots : les trois bornes du milieu réservées à un départ solide",
    "(Brelan en main, ou deux cartes de même couleur qui se suivent, bouts libres), et jamais",
    "la même valeur seule sur deux bornes. Le robot ainsi modifié a joué contre l'ancien",
    "(le « gourmand »), des deux côtés de la table :",
    "",
    ...fence(table(["Habitude", "Parties gagnées", "Fourchette à 95 %", "Parties"], rows, RIGHT)),
    "",
    "**Était-ce déjà pris en compte ?** En partie : l'ancien robot comptait déjà les cartes",
    "encore cachées (d'où ton « tant que la couleur n'est pas épuisée ») et hésitait à dépenser",
    "un joker. Mais chacune de tes habitudes le rend plus fort : les trois ensemble le font",
    `gagner ${pct(f.duels["strategist:habits"].rate, 0)} des parties contre l'ancien, et ${pct(f.duels.strategist.rate, 0)} avec tes deux idées.`,
    "C'est donc lui, le « stratège » version 1.1, qui joue désormais toutes les parties de ce rapport.",
    "",
  ];
}
