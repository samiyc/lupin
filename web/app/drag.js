import { $ } from "./dom.js";

/**
 * Input on the table, by event delegation (the table is redrawn often):
 *
 * - drag a card of the bottom hand onto a border's bottom side to play it;
 * - drag it onto another card of the hand to put it there;
 * - or click a card, then a border — or press 1 to 7 — and Escape to let go.
 *
 * `controller`: `{ enabled(), selected(), select(index|null), play(index,
 * border), reorder(from, to), legalFor(index) → Set of borders }`.
 */
const handIndex = (target) => {
  const card = target.closest(".hand.bottom .card");
  return card ? Number(card.dataset.index) : null;
};

const bottomSide = (target) => target.closest(".border")?.querySelector(".side.bottom") ?? null;

function markDropZones(legal) {
  document.querySelectorAll(".side.bottom").forEach((side) => {
    side.classList.toggle("drop-ok", legal.has(Number(side.dataset.border)));
  });
}

function clearDrag() {
  document.querySelectorAll(".dragging, .drop-target").forEach((node) => node.classList.remove("dragging", "drop-target"));
  markDropZones(new Set());
}

function onDragStart(event, controller) {
  const index = handIndex(event.target);
  if (index === null || !controller.enabled()) return event.preventDefault();
  event.dataTransfer.setData("text/plain", String(index));
  event.dataTransfer.effectAllowed = "move";
  event.target.closest(".card").classList.add("dragging");
  markDropZones(controller.legalFor(index));
  return undefined;
}

function onDragOver(event) {
  const side = bottomSide(event.target);
  const overCard = handIndex(event.target) !== null;
  if ((side && side.classList.contains("drop-ok")) || overCard) {
    event.preventDefault();
    side?.classList.add("drop-target");
  }
}

function onDrop(event, controller) {
  event.preventDefault();
  const from = Number(event.dataTransfer.getData("text/plain"));
  const side = bottomSide(event.target);
  const to = handIndex(event.target);
  clearDrag();
  if (side?.classList.contains("drop-ok") || (side && controller.legalFor(from).has(Number(side.dataset.border)))) {
    controller.play(from, Number(side.dataset.border));
  } else if (to !== null) {
    controller.reorder(from, to);
  }
}

function onClick(event, controller) {
  if (!controller.enabled()) return;
  const index = handIndex(event.target);
  if (index !== null) return controller.select(controller.selected() === index ? null : index);
  const border = event.target.closest(".border");
  const selected = controller.selected();
  if (border && selected !== null && controller.legalFor(selected).has(Number(border.dataset.border))) {
    controller.play(selected, Number(border.dataset.border));
  }
  return undefined;
}

/** Enter or Space on a focused card of the hand selects it. */
function selectFocused(event, controller) {
  const focused = handIndex(event.target);
  if ((event.key !== "Enter" && event.key !== " ") || focused === null) return;
  event.preventDefault();
  controller.select(focused);
}

/** 1 to 7 plays the selected card on that border, when it may go there. */
function playOnDigit(event, controller) {
  const selected = controller.selected();
  const border = Number(event.key) - 1;
  if (selected === null || !Number.isInteger(border) || border < 0 || border > 6) return;
  if (controller.legalFor(selected).has(border)) controller.play(selected, border);
}

function onKey(event, controller) {
  if (!controller.enabled() || event.target.closest("input, select, dialog")) return;
  if (event.key === "Escape") controller.select(null);
  selectFocused(event, controller);
  playOnDigit(event, controller);
}

export function setupInput(controller) {
  const table = $("table");
  table.addEventListener("dragstart", (event) => onDragStart(event, controller));
  table.addEventListener("dragover", onDragOver);
  table.addEventListener("dragleave", (event) => bottomSide(event.target)?.classList.remove("drop-target"));
  table.addEventListener("drop", (event) => onDrop(event, controller));
  table.addEventListener("dragend", clearDrag);
  table.addEventListener("click", (event) => onClick(event, controller));
  document.addEventListener("keydown", (event) => onKey(event, controller));
}
