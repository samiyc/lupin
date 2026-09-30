import { isJoker } from "../core/cards.js";

/**
 * The opening repertoire's keys and storage (`npm run openings`).
 *
 * A position and its recolourings are one opening: the rules never tell the
 * colours apart, and a joker has none. The borders read the same from either
 * end too, since three in a row counts both ways. So a key is the smallest of
 * the position's 24 × 2 forms, and the book stores the move in that form; a
 * lookup maps it back through the same symmetry. Duplicates between colours
 * cannot happen.
 *
 * The book is a binary file of fixed 12-byte records sorted by a 64-bit hash
 * of the key (two 32-bit FNV-1a), found by binary search: a lookup reads a
 * few dozen records whatever the size of the book.
 */
const RECORD = 12;
const MAGIC = 0x4c4f5042; // "LOPB"

function permutations(items) {
  if (items.length <= 1) return [items];
  return items.flatMap((item, i) => permutations([...items.slice(0, i), ...items.slice(i + 1)]).map((rest) => [item, ...rest]));
}

const symmetriesOf = (spec) => permutations([...Array(spec.colors).keys()]).flatMap((colors) => [false, true].map((mirror) => ({ colors, mirror })));
const cache = new WeakMap();
const symmetries = (spec) => {
  if (!cache.has(spec)) cache.set(spec, symmetriesOf(spec));
  return cache.get(spec);
};

/** `card` under a colour permutation (`colors[old] = new`); a joker stays a joker. */
export function recolour(spec, card, colors) {
  if (isJoker(card)) return card;
  return colors[Math.floor(card / spec.values)] * spec.values + (card % spec.values);
}

const inverse = (colors) => colors.map((_, target) => colors.indexOf(target));
const borderUnder = (spec, border, mirror) => (mirror ? spec.borders - 1 - border : border);
const listText = (cards) => [...cards].sort((a, b) => a - b).join(".");

/** The position of the player to move under one symmetry, as text: move number, hand, then each border (mine/theirs). */
function formOf(state, { colors, mirror }) {
  const { spec } = state;
  const me = state.current;
  const map = (cards) => cards.map((card) => recolour(spec, card, colors));
  const borders = state.borders.map((_, index) => state.borders[borderUnder(spec, index, mirror)]);
  const board = borders.map((border) => `${listText(map(border.sides[me]))}/${listText(map(border.sides[1 - me]))}`).join(";");
  return `${state.turn}|${listText(map(state.hands[me]))}|${board}`;
}

/** The canonical key of `state` for the player to move, and the symmetry that reaches it. */
export function canonicalKey(state) {
  let best = null;
  for (const symmetry of symmetries(state.spec)) {
    const key = formOf(state, symmetry);
    if (best === null || key < best.key) best = { key, symmetry };
  }
  return best;
}

/** A move of `state` in the canonical form, to store. */
export const toCanonical = (spec, move, { colors, mirror }) => ({ card: recolour(spec, move.card, colors), border: borderUnder(spec, move.border, mirror) });

/** A stored canonical move back in `state`'s own colours and direction. */
export const fromCanonical = (spec, move, { colors, mirror }) => ({ card: recolour(spec, move.card, inverse(colors)), border: borderUnder(spec, move.border, mirror) });

/** Two 32-bit FNV-1a hashes of `text`, with different offsets: 64 bits of key. */
export function hashKey(text) {
  let high = 0x811c9dc5;
  let low = 0x01000193 ^ 0x9e3779b9;
  for (let i = 0; i < text.length; i += 1) {
    const code = text.charCodeAt(i);
    high = Math.imul(high ^ code, 0x01000193) >>> 0;
    low = Math.imul(low ^ code, 0x01000193 ^ 0x5bd1e995) >>> 0;
  }
  return [high, low];
}

const compare = (a, b) => a[0] - b[0] || a[1] - b[1];

/** `entries`: `[{ key, move: { card, border }, visits }]`, moves canonical. A Uint8Array to write to disk. */
export function encodeBook(entries) {
  const rows = entries.map((entry) => ({ hash: hashKey(entry.key), ...entry })).sort((a, b) => compare(a.hash, b.hash));
  const bytes = new Uint8Array(8 + RECORD * rows.length);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, MAGIC);
  view.setUint32(4, rows.length);
  rows.forEach(({ hash, move, visits = 0 }, i) => {
    const at = 8 + RECORD * i;
    view.setUint32(at, hash[0]);
    view.setUint32(at + 4, hash[1]);
    view.setInt8(at + 8, move.card);
    view.setUint8(at + 9, move.border);
    view.setUint16(at + 10, Math.min(visits, 0xffff));
  });
  return bytes;
}

/** A reader over the bytes of a book: `lookup(key)` → the canonical move, or null. */
export function bookReader(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint32(0) !== MAGIC) throw new Error("Répertoire d'ouvertures illisible");
  const count = view.getUint32(4);
  const hashAt = (i) => [view.getUint32(8 + RECORD * i), view.getUint32(12 + RECORD * i)];
  return {
    count,
    lookup(key) {
      const hash = hashKey(key);
      let [low, high] = [0, count - 1];
      while (low <= high) {
        const mid = (low + high) >> 1;
        const order = compare(hashAt(mid), hash);
        if (order === 0) return { card: view.getInt8(16 + RECORD * mid), border: view.getUint8(17 + RECORD * mid) };
        if (order < 0) low = mid + 1;
        else high = mid - 1;
      }
      return null;
    },
  };
}
