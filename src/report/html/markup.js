/**
 * Tiny HTML helpers for the report generator. The generator only ever
 * inserts its own strings and numbers, but everything still goes through
 * `esc` so a label containing "<" or "&" cannot break the page.
 */
export const esc = (text) =>
  String(text).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

/** French typography: a narrow no-break space before % and between thousands. */
export const fr = (text) => esc(text).replace(/ (?=%)/g, " ").replace(/(\d) (?=\d{3}\b)/g, "$1 ");

export const tag = (name, attrs, ...children) => {
  const attributes = Object.entries(attrs ?? {})
    .filter(([, value]) => value !== false && value !== null && value !== undefined)
    .map(([key, value]) => (value === true ? ` ${key}` : ` ${key}="${esc(value)}"`))
    .join("");
  return `<${name}${attributes}>${children.join("")}</${name}>`;
};

const RED_SUITS = new Set(["♥", "♦"]);

/** A small playing card: `pc("4", "♥")`, or a joker with `pc("JK", "★", true)`. */
export function pc(value, suit, joker = false) {
  const cls = ["pc", RED_SUITS.has(suit) ? "r" : "", joker ? "jk" : ""].filter(Boolean).join(" ");
  return tag("span", { class: cls, "aria-label": `${value} ${suit}` }, tag("b", {}, esc(value)), tag("i", {}, esc(suit)));
}

export const mark = (ok) =>
  ok
    ? tag("span", { class: "mark ok", title: "à sa place" }, "✓")
    : tag("span", { class: "mark bad", title: "pas à sa place" }, "✗");

/** Fills `{{key}}` placeholders; a missing key stops the build. */
export function fill(template, values) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (!(key in values)) throw new Error(`Gabarit : valeur manquante « ${key} »`);
    return values[key];
  });
}
