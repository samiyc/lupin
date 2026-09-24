import { createRng } from "../../src/core/random.js";
import { replayStates } from "../../src/replay/log.js";
import { BOTS } from "../../src/sim/bots.js";
import { $ } from "./dom.js";
import { renderExplain } from "./explain.js";
import { START, endOf, isAtEnd, stepBack, stepForward } from "./steps.js";
import { SPEC, playerName } from "./runner.js";
import { renderTable } from "./table.js";
import { tableView } from "./view.js";

/**
 * The player of logged games, shared by "Observer" (a bot game generated on
 * the spot) and "Replays" (a saved log). Both hands are shown. Stepping past
 * the last move settles the borders one by one, as in a real game. Human
 * moves are weighed against what the strategist would have played.
 */
const viewer = { log: null, frames: [], index: 0, shown: 0, timer: null };

const last = () => viewer.frames.length - 1;
const settledCount = () => viewer.frames[last()]?.state.resolved.length ?? 0;
const atEnd = () => isAtEnd(viewer, last(), settledCount());
const moveTo = ({ index, shown }) => {
  [viewer.index, viewer.shown] = [index, shown];
};

function lastMoveOf(frame) {
  const entry = frame.entry;
  if (!entry?.move) return null;
  return { border: entry.move.border - 1, side: entry.player === 0 ? "bottom" : "top" };
}

export function render() {
  const { log, frames, index, timer } = viewer;
  if (log === null) return;
  const frame = frames[index];
  const lastMove = lastMoveOf(frame);
  const shown = index === last() ? viewer.shown : 0;
  const view = tableView(SPEC, frame.state, { bottom: 0, reveal: true, shown, lastMove });
  const names = { bottom: playerName(log.players[0]), top: playerName(log.players[1]) };
  renderTable(view, { status: timer ? "Lecture…" : "En pause.", names, lastMove, showTools: false });
  $("frame").textContent = `Coup ${index} / ${last()}`;
  $("btn-toggle").textContent = timer ? "❚❚" : "▶";
  $("btn-toggle").setAttribute("aria-label", timer ? "Pause" : "Lecture");
  renderExplain(log, frame);
}

export function pause() {
  clearInterval(viewer.timer);
  viewer.timer = null;
}

function next() {
  moveTo(stepForward(viewer, last(), settledCount()));
  if (atEnd()) pause();
  render();
}

function prev() {
  moveTo(stepBack(viewer));
  render();
}

/** Back to the deal. */
function first() {
  moveTo(START);
  render();
}

/** The final table, every border settled: the result at a glance. */
function end() {
  moveTo(endOf(last(), settledCount()));
  render();
}

function play() {
  pause();
  if (atEnd()) moveTo(START);
  viewer.timer = setInterval(next, Number($("speed").value));
  render();
}

export function load(log, { autoplay = false } = {}) {
  pause();
  viewer.log = log;
  viewer.frames = replayStates(log, { advisor: BOTS.strategist(createRng(1)) });
  moveTo(START);
  if (autoplay) play();
  else render();
}

export const loaded = () => viewer.log !== null;
export const currentLog = () => viewer.log;

const STEPS = { "btn-first": first, "btn-prev": prev, "btn-next": next, "btn-last": end };
const KEYS = { Home: first, End: end };

/** Home and End jump to either end while a game is loaded in the player. */
function onKey(event) {
  const step = KEYS[event.key];
  if (!step || $("player").hidden || viewer.log === null || event.target.closest?.("input, select, dialog")) return;
  event.preventDefault();
  pause();
  step();
}

export function wirePlayer() {
  for (const [id, step] of Object.entries(STEPS)) {
    $(id).addEventListener("click", () => {
      pause();
      step();
    });
  }
  document.addEventListener("keydown", onKey);
  $("btn-toggle").addEventListener("click", () => {
    if (!viewer.timer) return play();
    pause();
    return render();
  });
  $("speed").addEventListener("change", () => {
    if (viewer.timer) play();
  });
}
