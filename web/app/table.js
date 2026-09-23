import { $, el } from "./dom.js";
import { WIN_TYPES } from "./view.js";

/**
 * Draws the table from a view (`view.js`). Everything is redrawn on each
 * change: the table holds 48 cards at most, and a full redraw keeps the page
 * and the game state from drifting apart. Input is handled by `drag.js`,
 * through event delegation, so redraws do not lose it.
 */
const SUIT_NAMES = { "♠": "pique", "♥": "cœur", "♦": "carreau", "♣": "trèfle" };

export function cardElement(card, attrs = {}) {
  const label = card.joker ? "joker" : `${card.value} de ${SUIT_NAMES[card.suit]}`;
  const classes = ["card", card.red ? "red" : "", card.joker ? "joker" : "", attrs.class ?? ""].filter(Boolean).join(" ");
  const body = card.joker ? ["JOKER"] : [el("span", { class: "v" }, card.value), el("span", { class: "s" }, card.suit)];
  return el("div", { ...attrs, class: classes, "aria-label": label, title: label }, ...body);
}

const backElement = () => el("div", { class: "card back", "aria-hidden": "true" });

function renderTopHand(hand) {
  const cards = hand.hidden ? Array.from({ length: hand.count }, backElement) : hand.cards.map((card) => cardElement(card));
  $("hand-top").replaceChildren(...cards);
}

function renderBottomHand(hand, { interactive, selected }) {
  const cards = hand.cards.map((card, index) =>
    cardElement(card, {
      class: index === selected ? "selected" : "",
      draggable: interactive ? "true" : null,
      tabindex: interactive ? "0" : null,
      role: interactive ? "button" : null,
      dataset: { index },
    }),
  );
  $("hand-bottom").replaceChildren(...cards);
}

function sideElement(cards, position, border, { legal, lastMove }) {
  const drawn = cards.map((card, i) => cardElement(card, { class: lastMove && i === cards.length - 1 && position === lastMove ? "last" : "" }));
  const classes = ["side", position, legal ? "drop-ok" : ""].filter(Boolean).join(" ");
  return el("div", { class: classes, dataset: { border: border.index, position } }, ...drawn);
}

function stoneElement(border) {
  const classes = ["stone", border.stone.state, border.animate ? "animate" : ""].filter(Boolean).join(" ");
  const titles = { neutral: `Borne ${border.number}`, won: `Borne ${border.number} gagnée`, lost: `Borne ${border.number} perdue` };
  return el("div", { class: classes, title: titles[border.stone.state] }, String(border.number));
}

function borderElement(border, { legalBorders, lastMove }) {
  const legal = legalBorders.has(border.index);
  const lastSide = border.lastMove ? lastMove.side : null;
  return el(
    "div",
    { class: "border", dataset: { border: border.index } },
    el("p", { class: "formation" }, border.formations?.top ?? ""),
    sideElement(border.top, "top", border, { legal: false, lastMove: lastSide }),
    stoneElement(border),
    sideElement(border.bottom, "bottom", border, { legal, lastMove: lastSide }),
    el("p", { class: "formation" }, border.formations?.bottom ?? ""),
  );
}

function renderCounters(view, status) {
  $("pile-count").textContent = String(view.pile);
  $("turn").textContent = view.over ? "Partie terminée" : `Tour ${view.turn}`;
  $("status").textContent = status;
}

function renderBanner(result, names) {
  const banner = $("banner");
  if (!result) {
    banner.hidden = true;
    return;
  }
  const texts = { bottom: `${names.bottom} gagne`, top: `${names.top} gagne`, draw: "Égalité" };
  banner.className = `banner ${{ bottom: "won", top: "lost", draw: "" }[result.outcome]}`;
  banner.replaceChildren(texts[result.outcome], el("small", {}, `par ${WIN_TYPES[result.winType] ?? result.winType}`));
  banner.hidden = false;
}

/** An empty table with a message: no game in this tab yet, or one abandoned. */
export function clearTable(message) {
  for (const id of ["hand-top", "board", "hand-bottom", "label-top", "label-bottom"]) $(id).replaceChildren();
  $("sorters").hidden = true;
  $("banner").hidden = true;
  $("status").textContent = message;
}

/**
 * `options`: `{ status, names: { top, bottom }, interactive, selected,
 * legalBorders: Set, lastMove: { border, side } | null, showTools }`.
 */
export function renderTable(view, options) {
  const settings = { interactive: false, selected: null, legalBorders: new Set(), lastMove: null, showTools: false, ...options };
  renderCounters(view, settings.status);
  $("label-top").textContent = settings.names.top;
  $("label-bottom").textContent = settings.names.bottom;
  renderTopHand(view.top);
  renderBottomHand(view.bottom, settings);
  $("board").replaceChildren(...view.borders.map((border) => borderElement(border, settings)));
  $("sorters").hidden = !settings.showTools;
  renderBanner(view.result, settings.names);
}
