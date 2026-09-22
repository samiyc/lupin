import { DECKS, DECK_IDS, JOKER_RULES, JOKER_RULE_IDS } from "../../config/decks.js";
import { ORDER_IDS, ORDER_LABELS, ORDERS } from "../../config/formations.js";
import { PROFILE_ROWS, RANK_NAMES, label } from "../columns.js";
import { pct } from "../format.js";
import { esc, fr, tag } from "./markup.js";

const segment = (share, i, name, order) =>
  tag("span", {
    class: `seg seg-${i + 1}`,
    style: `flex-basis:${(100 * share).toFixed(2)}%`,
    title: `${name} — ${RANK_NAMES[i]} (${label(ORDERS[order][i])}) : ${pct(share)} des bornes`,
  });

const describeProfile = (name, profile) =>
  name + " : " + profile.map((share, i) => RANK_NAMES[i] + " " + pct(share)).join(", ");

export function profileChart(f) {
  const best = f.picks.classique.id;
  const rows = PROFILE_ROWS.map(({ id, label: name }) => {
    const sim = f.byId[id];
    return tag(
      "div",
      { class: id === best ? "prow pick" : "prow" },
      tag("span", { class: "plabel" }, esc(name)),
      tag("span", { class: "pbar", role: "img", "aria-label": describeProfile(name, sim.profile) },
        ...sim.profile.map((share, i) => segment(share, i, name, sim.order))),
      tag("span", { class: "pval num" }, fr(pct(sim.resemblance))),
    );
  });
  const legend = tag("ul", { class: "legend" }, ...RANK_NAMES.map((name, i) =>
    tag("li", {}, tag("span", { class: `sw-${i + 1}` }), i < 4 ? `${name} combinaison` : name)));
  const head = tag("div", { class: "prow phead" }, tag("span", {}, ""), tag("span", {}, "Part des bornes gagnées, par rang de la combinaison"), tag("span", { class: "pval" }, "Ressemblance"));
  return tag("div", { class: "profile" }, head, ...rows, legend);
}

export function statsTable(f) {
  const best = f.picks.classique.id;
  const header = ["Variante", "Ressemblance", "Bornes jouées à la somme", "Le plus de jokers gagne", "2e joueur gagne", "Cartes posées"];
  const rows = PROFILE_ROWS.map(({ id, label: name }) => {
    const sim = f.byId[id];
    const values = [
      pct(sim.resemblance),
      pct(sim.sumShare),
      sim.jokerEdge === null ? "—" : pct(sim.jokerEdge),
      pct(1 - sim.firstPlayerWins - sim.drawShare),
      sim.averageTurns.toFixed(1).replace(".", ","),
    ];
    return tag("tr", { class: id === best ? "pick-row" : null }, tag("td", {}, esc(name)), ...values.map((v) => tag("td", { class: id === best ? "pick" : null }, fr(v))));
  });
  return tag("table", {}, tag("thead", {}, tag("tr", {}, ...header.map((h) => tag("th", {}, esc(h))))), tag("tbody", {}, ...rows));
}

const RULE_ROWS = [["free", "Joker libre"], ["onePerBorder", "1 joker par borne"], ["colorless", "Joker sans couleur"]];

export function variantsGrid(f) {
  const best = f.picks.classique.id;
  const heat = (value) => Math.round(Math.max(0, Math.min(1, (value - 0.6) / 0.4)) * 45);
  const rows = RULE_ROWS.map(([rule, name]) =>
    tag("tr", {}, tag("td", {}, esc(name)), ...ORDER_IDS.map((order) => {
      const sim = f.byId[`classique-${rule}-${order}`];
      const style = `background:color-mix(in oklab, var(--rank-3) ${heat(sim.resemblance)}%, transparent)`;
      return tag("td", { class: sim.id === best ? "cell pick-cell" : "cell", style }, fr(`${sim.id === best ? "★ " : ""}${pct(sim.resemblance)}`));
    })),
  );
  const head = tag("tr", {}, tag("th", {}, ""), ...ORDER_IDS.map((o) => tag("th", {}, esc(ORDER_LABELS[o]))));
  return tag("table", { class: "heat" }, tag("thead", {}, head), tag("tbody", {}, ...rows));
}

export function rulesCard(f) {
  const order = ORDERS.original.map(label).join(" › ");
  const items = [
    ["Paquet", "52 cartes sans Valets, Dames ni Rois (As = 1), plus les 2 jokers : 42 cartes."],
    ["Joker", "Vaut le chiffre de votre choix, mais n’a pas de couleur."],
    ["Ordre", order],
    ["Partie", "7 bornes · 6 cartes en main · 4 bornes, ou 3 côte à côte, pour gagner."],
    ["Fidélité", `${pct(f.picks.classique.resemblance)} de ressemblance avec l’original.`],
  ];
  return tag("dl", { class: "rules" }, ...items.flatMap(([term, text]) => [tag("dt", {}, esc(term)), tag("dd", {}, fr(text))]));
}

const chip = (name, value, text, checked) =>
  tag("label", { class: "chip" }, tag("input", { type: "radio", name, value, id: `${name}-${value}`, checked }), tag("span", {}, esc(text)));

export const deckChips = () => DECK_IDS.map((id) => chip("deck", id, DECKS[id].label, id === "classique")).join("");
export const ruleChips = () => JOKER_RULE_IDS.map((id) => chip("rule", id, JOKER_RULES[id].label, id === "colorless")).join("");
export const orderChips = () => ORDER_IDS.map((id) => chip("order", id, ORDER_LABELS[id], id === "original")).join("");
