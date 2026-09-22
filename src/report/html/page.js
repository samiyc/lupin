import { readFileSync } from "node:fs";
import { DECKS, DECK_IDS } from "../../config/decks.js";
import { FORMATION_LABELS, ORDERS } from "../../config/formations.js";
import { RANK_NAMES } from "../columns.js";
import { dateFr, int, pct, smartPct } from "../format.js";
import * as exact from "./fragments-exact.js";
import * as play from "./fragments-play.js";
import { fill, fr } from "./markup.js";

const asset = (name) => readFileSync(new URL(`../page/${name}`, import.meta.url), "utf8");

const FONTS =
  "https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400" +
  "&family=Bodoni+Moda:opsz,wght@6..96,600;6..96,700&family=IBM+Plex+Mono:wght@400;600&display=swap";

/** The subset of the data the explorer script needs, nothing more. */
function explorerData(f, data) {
  const trim = (byOrder) =>
    Object.fromEntries(Object.entries(byOrder).map(([order, c]) => [order, { best: c.best, total: c.total }]));
  const map = (source, pick) =>
    Object.fromEntries(Object.entries(source).map(([deck, rules]) =>
      [deck, Object.fromEntries(Object.entries(rules).map(([rule, value]) => [rule, pick(value)]))]));
  return {
    orders: ORDERS,
    labels: { formations: FORMATION_LABELS, ranks: RANK_NAMES },
    jokers: Object.fromEntries(DECK_IDS.map((id) => [id, DECKS[id].jokers > 0])),
    exact: map(data.exact, trim),
    hands: map(data.startingHands, (hand) => hand.complete),
    sims: Object.fromEntries(f.sims.map((sim) => [sim.id, {
      profile: sim.profile, resemblance: sim.resemblance, sumShare: sim.sumShare, drawShare: sim.drawShare,
    }])),
  };
}

function numbers(f, data) {
  const cl = data.exact.classique.colorless.original.best;
  const tc = data.exact.tarot.colorless.original;
  const exactFree = data.exact.classique.free.original;
  const byId = f.byId;
  return {
    games: int(data.sizes.games),
    startingHands: int(data.sizes.startingHands),
    seed: String(data.seed),
    generated: dateFr(data.generatedAt),
    clSF: int(cl.straightFlush), cl3K: int(cl.threeOfAKind), clFL: int(cl.flush), clST: int(cl.straight),
    tarotCl3K: smartPct(tc.best.threeOfAKind / tc.total), tarotClFL: smartPct(tc.best.flush / tc.total),
    handFlush: pct(f.lenses.classique.hand.flush), handStraight: pct(f.lenses.classique.hand.straight),
    greedyWin: pct(f.greedyWinRate),
    randomSF: pct(byId["classique-free-original"].randomBuilt.straightFlush),
    exactSF: pct(exactFree.best.straightFlush / exactFree.total),
    refFlushBuilt: pct(f.reference.built.flush), refStraightBuilt: pct(f.reference.built.straight),
    refFirst: pct(f.reference.firstPlayerWins),
    jokerEdgeFree: pct(byId["classique-free-original"].jokerEdge),
    jokerEdgeColorless: pct(byId["classique-colorless-original"].jokerEdge),
    swapCost: String(Math.round(100 * (byId["classique-colorless-original"].resemblance - byId["classique-colorless-swapped"].resemblance))),
    onePerPlayerDraws: pct(byId["classique-onePerPlayer-original"].drawShare),
  };
}

function fragments(f, data) {
  return {
    verdictCards: exact.verdictCards(f),
    formationsGrid: exact.formationsGrid(),
    laddersGrid: exact.laddersGrid(f),
    paradoxChart: exact.paradoxChart(data),
    handTable: exact.handTable(f),
    outsTable: exact.outsTable(data),
    profileChart: play.profileChart(f),
    statsTable: play.statsTable(f),
    variantsGrid: play.variantsGrid(f),
    rulesCard: play.rulesCard(f),
    deckChips: play.deckChips(),
    ruleChips: play.ruleChips(),
    orderChips: play.orderChips(),
  };
}

/**
 * The page as the Artifact tool wants it: title, styles, content and script,
 * without the doctype/html/head/body skeleton, which the host adds.
 */
export function renderFragment(f, data) {
  const values = Object.fromEntries(Object.entries(numbers(f, data)).map(([k, v]) => [k, fr(v)]));
  const body = fill(asset("template.html"), { ...values, ...fragments(f, data) });
  const payload = JSON.stringify(explorerData(f, data)).replace(/</g, "\\u003c");
  return [
    "<title>Schotten Totten à 42 cartes</title>",
    '<link rel="preconnect" href="https://fonts.googleapis.com">',
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
    `<link rel="stylesheet" href="${FONTS}">`,
    `<style>\n${asset("style.css")}\n</style>`,
    body,
    `<script>\nconst REPORT_DATA = ${payload};\n</script>`,
    `<script>\n${asset("explorer.js")}\n</script>`,
  ].join("\n");
}

/** A complete document, for opening `out/statistiques.html` from the disk. */
export function renderDocument(f, data) {
  const fragment = renderFragment(f, data);
  const cut = fragment.indexOf("<header");
  return [
    "<!doctype html>",
    '<html lang="fr">',
    "<head>",
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">',
    fragment.slice(0, cut),
    "</head>",
    "<body>",
    fragment.slice(cut),
    "</body>",
    "</html>",
  ].join("\n");
}
