import { writeFile } from "node:fs/promises";
import { DECKS, JOKER_RULES } from "../src/config/decks.js";
import { FORMATIONS, ORDERS, PATTERNS } from "../src/config/formations.js";
import { enumerateTriples, inversions, rarityOrder } from "../src/core/combinatorics.js";

/**
 * `npm run bretagne`: a proposal only, nothing in the game changes. "Les 7
 * Menhirs" deals 4 colours × (1-9 + one royal figure) + 2 colourless jokers,
 * 42 cards like the Classique, and gives the figure combinations of its own.
 * Every 3-card hand is enumerated once per variant, and the counts go to
 * out/lore-exploration.json for out/lore-exploration.html.
 *
 * Unless a variant says otherwise the figure is the 10 of its colour, so the
 * deck plays exactly like the Classique; each rule only adds readings:
 * - `cour`: figure + a pair of real cards → three of a kind (a joker does
 *   not join the court: that is what keeps the figure apart from it);
 * - `lignee`: figure + two suited cards one or two apart → straight flush;
 * - `royale`: figure + two cards of one colour of its blazon (red ♥♦ or
 *   black ♠♣) → flush;
 * - `banniere`: the figure is every colour and no value — the joker's mirror.
 *
 * The share of each formation among the hands holding exactly one figure is
 * the figure's balance; the same share for one joker is the yardstick.
 */
const VARIANTS = {
  cour: { label: "La Cour", rules: ["cour"] },
  lignee: { label: "La Lignée", rules: ["lignee"] },
  banniere: { label: "La Bannière", rules: ["banniere"] },
  trois: { label: "Les trois couronnes", rules: ["cour", "lignee", "royale"] },
};
const ORDER = ORDERS.original;
const COLORS = 4;
const JOKER = { joker: true };

function bretonDeck() {
  const deck = [JOKER, JOKER];
  for (let color = 0; color < COLORS; color += 1) {
    for (let value = 1; value <= 9; value += 1) deck.push({ color, value });
    deck.push({ color, value: 10, figure: true });
  }
  return deck;
}

/** ♠ ♥ ♦ ♣ (decks.js): hearts and diamonds are red, spades and clubs black. */
const blazon = (color) => (color === 1 || color === 2 ? "red" : "black");
const rankOf = (formation) => ORDER.indexOf(formation);
const sameColor = (cards) => cards.every((card) => card.color >= 0 && card.color === cards[0].color);

function plainFormation(cards) {
  const values = cards.map((card) => card.value).sort((a, b) => a - b);
  const run = values[1] === values[0] + 1 && values[2] === values[1] + 1;
  if (sameColor(cards) && run) return "straightFlush";
  if (values[0] === values[2]) return "threeOfAKind";
  if (sameColor(cards)) return "flush";
  return run ? "straight" : "sum";
}

/** The banner figure: any colour, no value. It only ever helps a flush. */
function bannerFormation(cards, figure) {
  const others = cards.filter((card) => card !== figure);
  return sameColor(others) ? "flush" : "sum";
}

/** The figure's own rules, each reading `figure` + two cards: the formation it makes, or null. */
const ROYAL = {
  cour: (_figure, [a, b]) => (a.color >= 0 && b.color >= 0 && a.value === b.value ? "threeOfAKind" : null),
  lignee: (_figure, [a, b]) => {
    const gap = Math.abs(a.value - b.value);
    return sameColor([a, b]) && gap >= 1 && gap <= 2 ? "straightFlush" : null;
  },
  royale: (figure, [a, b]) => (sameColor([a, b]) && blazon(a.color) === blazon(figure.color) ? "flush" : null),
};

const royalReadings = (rules, figure, others) =>
  Object.entries(ROYAL)
    .filter(([rule]) => rules.has(rule))
    .map(([, read]) => read(figure, others))
    .filter(Boolean);

const strongest = (formations) => formations.reduce((a, b) => (rankOf(b) < rankOf(a) ? b : a));

/** The best formation of three concrete cards (jokers already given a value). */
function formationOf(cards, rules) {
  const figures = cards.filter((card) => card.figure);
  if (figures.length !== 1) return plainFormation(cards);
  const [figure] = figures;
  const base = rules.has("banniere") ? bannerFormation(cards, figure) : plainFormation(cards);
  return strongest([base, ...royalReadings(rules, figure, cards.filter((card) => card !== figure))]);
}

/** Every value a colourless joker may take, crossed over the jokers of the hand. */
function readings(hand) {
  let hands = [[]];
  for (const card of hand) {
    const options = card.joker ? Array.from({ length: 10 }, (_, i) => ({ color: -1, value: i + 1 })) : [card];
    hands = hands.flatMap((partial) => options.map((option) => [...partial, option]));
  }
  return hands;
}

const zero = () => Object.fromEntries(FORMATIONS.map((f) => [f, 0]));

/** Every 3-card hand of `deck`, once. */
function triples(deck) {
  const hands = [];
  for (let i = 0; i < deck.length; i += 1) {
    for (let j = i + 1; j < deck.length; j += 1) {
      for (let k = j + 1; k < deck.length; k += 1) hands.push([deck[i], deck[j], deck[k]]);
    }
  }
  return hands;
}

const holdsOne = (hand, kind) => hand.filter((card) => card[kind]).length === 1;

/** Counts over every hand, over the hands holding exactly one figure, and exactly one joker. */
function countVariant(rules) {
  const tally = { best: zero(), withFigure: zero(), withJoker: zero() };
  for (const hand of triples(bretonDeck())) {
    const formation = strongest(readings(hand).map((cards) => formationOf(cards, rules)));
    tally.best[formation] += 1;
    if (holdsOne(hand, "figure")) tally.withFigure[formation] += 1;
    if (holdsOne(hand, "joker")) tally.withJoker[formation] += 1;
  }
  return tally;
}

const share = (counts) => {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  return Object.fromEntries(Object.entries(counts).map(([f, n]) => [f, n / total]));
};
const describe = (counts) => ({ counts, rarity: rarityOrder(counts), inversions: inversions(counts, ORDER) });

const started = performance.now();
const classique = enumerateTriples(DECKS.classique, ORDER, JOKER_RULES.colorless);
const plain = countVariant(new Set());
const result = {
  patterns: PATTERNS,
  classique: describe(classique.best),
  plain: { ...describe(plain.best), figureShare: share(plain.withFigure), jokerShare: share(plain.withJoker) },
  variants: Object.fromEntries(
    Object.entries(VARIANTS).map(([id, { label, rules }]) => {
      const { best, withFigure } = countVariant(new Set(rules));
      return [id, { label, rules, ...describe(best), figureShare: share(withFigure) }];
    }),
  ),
};
await writeFile(new URL("../out/lore-exploration.json", import.meta.url), `${JSON.stringify(result, null, 2)}\n`);
const pct = (x) => `${(100 * x).toFixed(1).replace(".", ",")} %`;
console.log("| Paquet | SC | Br | Co | Su | So | Inversions | Avec une figure : SC / Br / Co |");
console.log("| --- | --- | --- | --- | --- | --- | --- | --- |");
const row = (label, { counts, inversions: inv, figureShare }) => {
  const fig = figureShare ? `${pct(figureShare.straightFlush)} / ${pct(figureShare.threeOfAKind)} / ${pct(figureShare.flush)}` : "—";
  console.log(`| ${label} | ${FORMATIONS.map((f) => counts[f]).join(" | ")} | ${inv.length} | ${fig} |`);
};
row("Classique", result.classique);
row("Figure = 10", result.plain);
row("(un joker, pour comparer)", { ...result.plain, figureShare: result.plain.jokerShare });
for (const variant of Object.values(result.variants)) row(variant.label, variant);
console.log(`\nDurée : ${((performance.now() - started) / 1000).toFixed(1)} s`);
