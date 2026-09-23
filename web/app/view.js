import { FORMATION_LABELS } from "../../src/config/formations.js";
import { colorOf, isJoker, valueOf } from "../../src/core/cards.js";
import { formatCard } from "../../src/core/notation.js";

/**
 * From a game snapshot (`snapshot()` in `src/replay/log.js`) to what the
 * page draws. Pure, so what the player sees is tested under Node:
 *
 * - `bottom` is the seat drawn at the bottom (the human, or seat 1 of the
 *   first bot when observing); the stones read green or red from its side;
 * - `reveal` shows both hands (observer, replays) or hides the top one;
 * - `shown` is how many resolved borders to show: the end of a game reveals
 *   them one by one, in the order they filled.
 */
const RED_SUITS = new Set(["♥", "♦"]);

export function cardView(spec, card) {
  if (isJoker(card)) return { id: card, text: "JK", value: "JK", suit: "★", red: false, joker: true };
  const suit = spec.suits[colorOf(spec, card)];
  return { id: card, text: formatCard(spec, card), value: String(valueOf(spec, card)), suit, red: RED_SUITS.has(suit), joker: false };
}

function stoneOf(resolved, bottom) {
  if (!resolved) return { state: "neutral", toward: null };
  const mine = resolved.winner === bottom;
  return { state: mine ? "won" : "lost", toward: mine ? "bottom" : "top" };
}

function borderView(spec, snap, index, context) {
  const { bottom, visible, justRevealed, lastMove } = context;
  const top = 1 - bottom;
  const border = snap.borders[index];
  const resolved = visible.find((entry) => entry.border === index) ?? null;
  return {
    index,
    number: index + 1,
    top: border.sides[top].map((card) => cardView(spec, card)),
    bottom: border.sides[bottom].map((card) => cardView(spec, card)),
    stone: stoneOf(resolved, bottom),
    animate: resolved !== null && resolved === justRevealed,
    formations: resolved
      ? { top: FORMATION_LABELS[resolved.formations[top]], bottom: FORMATION_LABELS[resolved.formations[bottom]] }
      : null,
    lastMove: lastMove !== null && lastMove.border === index,
  };
}

function resultView(snap, bottom, complete) {
  if (!snap.over || !complete) return null;
  if (snap.winner === null) return { outcome: "draw", winType: snap.winType };
  return { outcome: snap.winner === bottom ? "bottom" : "top", winType: snap.winType };
}

const DEFAULTS = Object.freeze({ bottom: 0, reveal: false, handOrder: null, shown: Infinity, lastMove: null });

function topHand(spec, snap, seat, reveal) {
  const cards = reveal ? snap.hands[seat].map((card) => cardView(spec, card)) : [];
  return { seat, hidden: !reveal, count: snap.hands[seat].length, cards };
}

function bottomHand(spec, snap, seat, handOrder) {
  return { seat, cards: (handOrder ?? snap.hands[seat]).map((card) => cardView(spec, card)) };
}

/** `{ turn, over, pile, current, top, bottom, borders, result }` for `snap`. */
export function tableView(spec, snap, options) {
  const { bottom, reveal, handOrder, shown, lastMove } = { ...DEFAULTS, ...options };
  const visible = snap.resolved.slice(0, shown);
  const context = { bottom, visible, justRevealed: visible.at(-1) ?? null, lastMove };
  return {
    turn: Math.min(snap.turn + 1, 42),
    over: snap.over,
    pile: snap.pile,
    current: snap.current === bottom ? "bottom" : "top",
    top: topHand(spec, snap, 1 - bottom, reveal),
    bottom: bottomHand(spec, snap, bottom, handOrder),
    borders: snap.borders.map((_, index) => borderView(spec, snap, index, context)),
    result: resultView(snap, bottom, visible.length === snap.resolved.length),
  };
}

export const WIN_TYPES = Object.freeze({
  adjacent: "trois bornes côte à côte",
  majority: "quatre bornes",
  exhaustion: "le plus de bornes",
  draw: "égalité",
});
