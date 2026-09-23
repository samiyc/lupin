import { ORDERS, PATTERNS } from "../../config/formations.js";
import { agreesWith } from "../analysis.js";
import { COLUMNS, label } from "../columns.js";
import { int, pct, smartPct } from "../format.js";
import { esc, fr, mark, pc, tag } from "./markup.js";

const PICK = "classiqueColorless";
const rankClass = (formation) => `var(--rank-${ORDERS.original.indexOf(formation) + 1})`;

export function verdictCards(f) {
  const ratio = (f.byId["classique-free-original"].profile[0] / f.reference.profile[0]).toFixed(1).replace(".", ",");
  const cards = [
    ["♠", "Joker sans couleur", "Il prend le chiffre qu’on veut, jamais la couleur."],
    ["♥", "Ordre inchangé", "Suite couleur, Brelan, Couleur, Suite, Somme : rien à réordonner."],
    ["♦", `${pct(f.picks.classique.resemblance)} fidèle`, `à l’original : la meilleure de toutes les variantes (ta version rapide : ${pct(f.rapide.resemblance)}).`],
    ["♣", "Joker libre : non", `Aucun ordre ne tient, et la Suite couleur gagne ${ratio} fois plus de bornes.`],
  ];
  return cards
    .map(([suit, title, text]) =>
      tag(
        "article",
        { class: "vcard" },
        tag("span", { class: suit === "♥" || suit === "♦" ? "pip r" : "pip", "aria-hidden": "true" }, suit),
        tag("p", { class: "big" }, fr(title)),
        tag("p", {}, fr(text)),
      ),
    )
    .join("");
}

const EXAMPLES = [
  ["straightFlush", [["4", "♥"], ["5", "♥"], ["6", "♥"]], "Trois cartes qui se suivent, de la même couleur."],
  ["threeOfAKind", [["7", "♠"], ["7", "♥"], ["7", "♦"]], "Trois cartes de même valeur."],
  ["flush", [["2", "♣"], ["5", "♣"], ["9", "♣"]], "Trois cartes de la même couleur."],
  ["straight", [["8", "♠"], ["9", "♥"], ["10", "♦"]], "Trois cartes qui se suivent."],
  ["sum", [["3", "♦"], ["7", "♠"], ["10", "♥"]], "Tout le reste : on additionne (ici 20)."],
];

export const formationsGrid = () =>
  EXAMPLES.map(([formation, hand, text], i) =>
    tag(
      "div",
      { class: "form" },
      tag("span", { class: "rank" }, `${i + 1}${i === 0 ? "re" : "e"}`),
      tag("h3", {}, esc(label(formation))),
      tag("div", { class: "trio" }, ...hand.map(([v, s]) => pc(v, s))),
      tag("p", {}, esc(text)),
    ),
  ).join("");

function rung(formation, i, share, max) {
  const ok = ORDERS.original.indexOf(formation) === i;
  const width = Math.max(1, (100 * share) / max).toFixed(1);
  return tag(
    "div",
    { class: "rung" },
    tag("span", { class: "num" }, String(i + 1)),
    tag("span", {}, esc(label(formation))),
    tag("span", { class: "track" }, tag("span", { class: "fill", style: `display:block;width:${width}%;background:${rankClass(formation)}` })),
    tag("span", { class: "v num" }, fr(smartPct(share))),
    mark(ok),
  );
}

function ladderPanel(column, lens) {
  const { counts, total } = lens.triples;
  const rare = [...PATTERNS].sort((x, y) => counts[x] - counts[y]);
  const max = Math.max(...rare.map((f) => counts[f] / total));
  const ok = agreesWith(counts, "original");
  return tag(
    "div",
    { class: column.key === PICK ? "ladder pick" : "ladder" },
    tag("header", {}, tag("h3", {}, esc(column.head === "4 coul." ? "4 couleurs" : column.head)), tag("span", { class: "sub" }, esc(column.sub))),
    ...rare.map((formation, i) => rung(formation, i, counts[formation] / total, max)),
    tag("p", { class: "verdict-line" }, ok ? "Ordre des règles respecté ✓" : "Ordre des règles bousculé ✗"),
  );
}

export const laddersGrid = (f) => COLUMNS.map((column) => ladderPanel(column, f.lenses[column.key])).join("");

function pairRows(title, entries, max) {
  const rarest = entries.reduce((a, b) => (b[1] < a[1] ? b : a))[0];
  const bars = entries.map(([name, count]) =>
    tag(
      "div",
      {},
      tag("span", {}, esc(name)),
      tag("span", { class: name === rarest ? "bar hi" : "bar", style: `width:${((100 * count) / max).toFixed(1)}%` }),
      tag("span", { class: "num" }, String(count)),
    ),
  );
  return tag("div", { class: "row" }, tag("strong", {}, esc(title)), tag("div", { class: "pair" }, ...bars));
}

export function paradoxChart(data) {
  const free = data.exact.classique.free;
  const colorless = data.exact.classique.colorless.original.best;
  const rows = [
    ["Ordre d’origine", free.original.best],
    ["Les deux échangés", free.swapped.best],
    ["Joker sans couleur", colorless],
  ];
  const max = Math.max(...rows.flatMap(([, b]) => [b.straightFlush, b.threeOfAKind]));
  return rows
    .map(([title, best]) =>
      pairRows(title, [["Suite couleur", best.straightFlush], ["Brelan", best.threeOfAKind]], max),
    )
    .join("");
}

const headRow = (first) =>
  tag("tr", {}, tag("th", {}, esc(first)), ...COLUMNS.map((c) =>
    tag("th", { class: c.key === PICK ? "pick" : null }, esc(c.head), tag("small", {}, esc(c.sub))),
  ));

const cells = (values) => values.map((v, i) => tag("td", { class: COLUMNS[i].key === PICK ? "pick" : null }, v));

export function handTable(f) {
  const rows = PATTERNS.map((formation) =>
    tag("tr", {}, tag("td", {}, esc(label(formation))), ...cells(COLUMNS.map((c) => fr(pct(f.lenses[c.key].hand[formation]))))),
  );
  const check = tag("tr", { class: "check" }, tag("td", {}, "Ordre respecté ?"), ...cells(COLUMNS.map((c) => mark(agreesWith(f.lenses[c.key].hand, "original")))));
  return tag("table", {}, tag("thead", {}, headRow("Déjà en main")), tag("tbody", {}, ...rows, check));
}

function jokerChip(count) {
  const noun = count > 1 ? "jokers" : "joker";
  return tag("span", { class: "jk-chip" }, `+${count} ${noun}`);
}

export function outsTable(data) {
  const rows = data.outs.original.free.map((row, i) =>
    tag("tr", {}, tag("td", {}, esc(row.label)), ...cells(COLUMNS.map((c) => {
      const cell = data.outs[c.deck][c.rule][i];
      return cell.jokers ? String(cell.real) + jokerChip(cell.jokers) : String(cell.real);
    }))),
  );
  const unseen = tag("tr", {}, tag("td", {}, "Cartes restantes"), ...cells(COLUMNS.map((c) => fr(int(data.outs[c.deck][c.rule][0].unseen)))));
  return tag("table", {}, tag("thead", {}, headRow("Deux cartes posées")), tag("tbody", {}, ...rows, unseen));
}
