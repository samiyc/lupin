import { $ } from "./dom.js";
import { setupInput } from "./drag.js";
import { wireObserve, wireReplays } from "./panels.js";
import { hasGame, playInput, render as renderPlay, setVisible, wirePlayControls } from "./play.js";
import { clearTable } from "./table.js";
import { loaded, pause, render as renderViewer, wirePlayer } from "./viewer.js";

/**
 * Boot: three tabs over one table. "Jouer" is live and takes input; "Observer"
 * and "Replays" drive the shared viewer. Only the visible tab draws on the
 * table: a bot still thinking in "Jouer" waits for its tab to come back.
 */
const replays = wireReplays();

wirePlayer();
wirePlayControls();
wireObserve();
setupInput(playInput);

const PANELS = {
  play: ["panel-play"],
  observe: ["panel-observe", "player", "explain"],
  replays: ["panel-replays", "player", "explain"],
};

const EMPTY_MESSAGES = {
  play: "Lance une nouvelle partie.",
  observe: "Choisis deux robots et lance une partie.",
  replays: "Choisis une partie dans la liste.",
};

function redraw(mode) {
  const live = mode === "play" ? hasGame() : loaded();
  if (!live) return clearTable(EMPTY_MESSAGES[mode]);
  return mode === "play" ? renderPlay() : renderViewer();
}

function show(mode) {
  document.querySelectorAll(".tabs [role=tab]").forEach((tab) => tab.setAttribute("aria-selected", String(tab.dataset.mode === mode)));
  const visible = new Set(PANELS[mode]);
  for (const id of new Set(Object.values(PANELS).flat())) $(id).hidden = !visible.has(id);
  pause();
  setVisible(mode === "play");
  redraw(mode);
  if (mode === "replays") replays.refresh();
}

document.querySelectorAll(".tabs [role=tab]").forEach((tab) => tab.addEventListener("click", () => show(tab.dataset.mode)));
show("play");
$("dialog-new").showModal();

// `?debug` exposes the play controls, to drive a game from the console or a
// browser-automation tool. Off by default.
if (new URLSearchParams(location.search).has("debug")) window.__lopin = { play: playInput, show };
