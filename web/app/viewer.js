import { createRng } from "../../src/core/random.js";
import { replayStates } from "../../src/replay/log.js";
import { BOTS } from "../../src/sim/bots.js";
import { $ } from "./dom.js";
import { renderExplain } from "./explain.js";
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
const atEnd = () => viewer.index === last() && viewer.shown >= settledCount();

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
  if (viewer.index < last()) viewer.index += 1;
  else if (viewer.shown < settledCount()) viewer.shown += 1;
  if (atEnd()) pause();
  render();
}

function prev() {
  if (viewer.index === last() && viewer.shown > 0) viewer.shown = 0;
  else if (viewer.index > 0) viewer.index -= 1;
  render();
}

function play() {
  pause();
  if (atEnd()) [viewer.index, viewer.shown] = [0, 0];
  viewer.timer = setInterval(next, Number($("speed").value));
  render();
}

export function load(log, { autoplay = false } = {}) {
  pause();
  viewer.log = log;
  viewer.frames = replayStates(log, { advisor: BOTS.strategist(createRng(1)) });
  [viewer.index, viewer.shown] = [0, 0];
  if (autoplay) play();
  else render();
}

export const loaded = () => viewer.log !== null;
export const currentLog = () => viewer.log;

export function wirePlayer() {
  $("btn-next").addEventListener("click", () => {
    pause();
    next();
  });
  $("btn-prev").addEventListener("click", () => {
    pause();
    prev();
  });
  $("btn-toggle").addEventListener("click", () => {
    if (!viewer.timer) return play();
    pause();
    return render();
  });
  $("speed").addEventListener("change", () => {
    if (viewer.timer) play();
  });
}
