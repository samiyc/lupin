import { FORMATIONS } from "../config/formations.js";
import { label } from "./columns.js";
import { pct, smartPct } from "./format.js";
import { esc, fr, tag } from "./html/markup.js";

/**
 * The statistics box of the printed rules (`regles/regles.html`), written
 * between two markers by the build, so the sheet never carries a number
 * typed by hand. Four columns, four different measures — the note says so.
 */
export const MARKERS = Object.freeze({ start: "<!-- stats:début -->", end: "<!-- stats:fin -->" });

function statsRows(f) {
  const exact = f.lenses.classiqueColorless.triples;
  const hand = f.lenses.classiqueColorless.hand;
  const game = f.byId["classique-colorless-original"].winning;
  return FORMATIONS.map((formation) =>
    tag(
      "tr",
      {},
      tag("td", {}, esc(label(formation))),
      tag("td", {}, fr(smartPct(exact.counts[formation] / exact.total))),
      tag("td", {}, formation === "sum" ? "—" : fr(pct(hand[formation], 0))),
      tag("td", {}, fr(pct(game[formation], 0))),
      tag("td", {}, fr(pct(f.irl.all[formation].share, 0))),
    ),
  );
}

export function renderRulesStats(f) {
  const head = tag(
    "tr",
    {},
    ...["Combinaison", "3 cartes au hasard", "Dans une main de 6", "Bornes gagnées", "Nos essais"].map((title) =>
      tag("th", {}, esc(title)),
    ),
  );
  const note =
    `Le hasard seul donne rarement une combinaison : on la construit en choisissant ses cartes. ` +
    `« Bornes gagnées » : parties simulées entre deux ordinateurs. « Nos essais » : ${f.irl.columns} groupes de 3 cartes joués pour de vrai.`;
  return [
    MARKERS.start,
    tag(
      "section",
      { class: "box stats" },
      tag("h3", {}, "Les combinaisons en chiffres"),
      tag("table", {}, tag("thead", {}, head), tag("tbody", {}, ...statsRows(f))),
      tag("p", { class: "note" }, fr(note)),
    ),
    MARKERS.end,
  ].join("\n  ");
}

/** Replaces the block between the markers; throws if they are missing. */
export function injectRulesStats(html, block) {
  const start = html.indexOf(MARKERS.start);
  const end = html.indexOf(MARKERS.end);
  if (start < 0 || end < start) throw new Error("regles.html : marqueurs de statistiques introuvables");
  return html.slice(0, start) + block + html.slice(end + MARKERS.end.length);
}
