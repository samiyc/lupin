import { FORMATIONS } from "../../config/formations.js";
import { label } from "../columns.js";
import { int, pct } from "../format.js";
import { esc, fr, tag } from "./markup.js";

/**
 * The real games and the habits, as HTML tables. Same numbers as
 * `ascii/sections-irl.js`, from the same findings.
 */
const SOLO = "solo-classique-strategist";

const row = (cells, className) =>
  tag("tr", { class: className ?? null }, tag("td", {}, esc(cells[0])), ...cells.slice(1).map((cell) => tag("td", {}, fr(cell))));

const head = (cells) =>
  tag("thead", {}, tag("tr", {}, ...cells.map(([title, sub]) => tag("th", {}, esc(title), sub ? tag("small", {}, esc(sub)) : ""))));

/** A share with its 95 % interval drawn as a thin range under the number. */
function shareWithRange(entry) {
  const range = `${pct(entry.low, 0)} – ${pct(entry.high, 0)}`;
  return `${fr(pct(entry.share))}${tag("small", { class: "range" }, fr(range))}`;
}

export function irlTable(f) {
  const exact = f.lenses.classiqueColorless.triples;
  const twoPlayer = f.byId["classique-colorless-original"].built;
  const rows = FORMATIONS.map((formation) =>
    tag(
      "tr",
      {},
      tag("td", {}, esc(label(formation))),
      tag("td", { class: "pick" }, shareWithRange(f.irl.all[formation])),
      ...[
        f.solo[SOLO].all[formation].share,
        f.solo["solo-classique-greedy"].all[formation].share,
        twoPlayer[formation],
        exact.counts[formation] / exact.total,
      ].map((share) => tag("td", {}, fr(pct(share)))),
    ),
  );
  const columns = [
    ["Combinaison"],
    ["Toi", `${f.irl.columns} colonnes`],
    ["Robot stratège", "même protocole"],
    ["Robot gourmand", "même protocole"],
    ["Partie à deux", "robots"],
    ["3 cartes", "au hasard"],
  ];
  return tag("table", {}, head(columns), tag("tbody", {}, ...rows));
}

export function irlLinesTable(f) {
  const solo = f.solo[SOLO];
  const rows = ["straightFlush", "threeOfAKind", "flush", "sum"].map((formation) =>
    row([label(formation), pct(f.irl.haut[formation].share), pct(f.irl.bas[formation].share), pct(solo.haut[formation].share), pct(solo.bas[formation].share)]),
  );
  return tag("table", {}, head([["Combinaison"], ["Toi", "haut"], ["Toi", "bas"], ["Robot", "haut"], ["Robot", "bas"]]), tag("tbody", {}, ...rows));
}

export function feelingTable(f) {
  const [classique, rapide] = [f.solo[SOLO], f.solo["solo-rapide-strategist"]];
  const rows = ["straightFlush", "threeOfAKind", "flush"].map((formation) =>
    row([label(formation), pct(classique.all[formation].share), pct(rapide.all[formation].share)]),
  );
  return tag("table", {}, head([["Robot stratège, seul"], ["4 couleurs", "+ joker sans couleur"], ["Rapide", "6 × 7"]]), tag("tbody", {}, ...rows));
}

const HABITS = [
  ["strategist:joker", "Garder le joker pour un Brelan"],
  ["strategist:opening", "Ouvrir au milieu, une couleur à la fois"],
  ["strategist:suited", "Suite couleur plutôt que paire"],
  ["strategist", "Les trois ensemble"],
];

/** Win rate against the previous bot, with a bar from 50 % (a draw of skill). */
export function duelsTable(f) {
  const rows = HABITS.map(([id, name]) => {
    const duel = f.duels[id];
    const width = Math.max(0, Math.min(100, ((duel.rate - 0.5) / 0.1) * 100)).toFixed(1);
    return tag(
      "tr",
      { class: id === "strategist" ? "pick-row" : null },
      tag("td", {}, esc(name)),
      tag("td", {}, fr(pct(duel.rate))),
      tag("td", { class: "edge" }, tag("span", { class: "edge-bar", style: `width:${width}%` })),
      tag("td", {}, fr(`${pct(duel.low)} – ${pct(duel.high)}`)),
      tag("td", {}, fr(int(duel.games))),
    );
  });
  const columns = [["Habitude"], ["Parties gagnées"], ["Au-delà de 50 %", "échelle : 50 → 60 %"], ["Fourchette à 95 %"], ["Parties"]];
  return tag("table", { class: "duels" }, head(columns), tag("tbody", {}, ...rows));
}
