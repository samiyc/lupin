import { int } from "./format.js";
import { formations, outs, startingHand, triples, verdict } from "./ascii/sections-exact.js";
import { method, recommendation, simulation, variants } from "./ascii/sections-play.js";
import { realGames, strategies } from "./ascii/sections-irl.js";

/** `out/statistiques.md`: the whole report as Markdown with ASCII art. */
export function renderMarkdown(findings, data) {
  const header = [
    "# Schotten Totten en cartes classiques — les chiffres",
    "",
    `> Généré par \`npm run build\` · graine ${data.seed} · ${int(data.sizes.games)} parties par variante.`,
    "> Aucun chiffre de ce fichier n'a été tapé à la main.",
    "",
    "On compare quatre façons de jouer : l'**original** (6 couleurs × 1-9, 9 bornes), ta",
    "version **rapide** (6 couleurs × 1-7, 7 bornes), le **4 couleurs** (jeu de 52 cartes :",
    "As à 10 + 2 jokers) et le **tarot** (4 couleurs + les atouts, de 1 à 8, + 2 atouts libres).",
    "",
  ];
  return [
    ...header,
    ...verdict(findings),
    ...formations(),
    ...triples(findings, data),
    ...startingHand(findings),
    ...outs(data),
    ...simulation(findings, data),
    ...variants(findings),
    ...realGames(findings),
    ...strategies(findings),
    ...recommendation(findings),
    ...method(data),
  ].join("\n");
}
