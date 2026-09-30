import { $, openDialog } from "./dom.js";
import { setupInput } from "./drag.js";
import { wireObserve, wireReplays } from "./panels.js";
import { hasGame, playInput, render as renderPlay, setVisible, wirePlayControls } from "./play.js";
import { puzzleInput, render as renderPuzzle, showPuzzles, wirePuzzles } from "./puzzles.js";
import { clearTable, wireSuitBar } from "./table.js";
import { loaded, pause, render as renderViewer, wirePlayer } from "./viewer.js";

/**
 * Boot: four tabs over one table. "Jouer" and "Puzzles" take input — routed
 * to the tab on show; "Observer" and "Replays" drive the shared viewer. Only
 * the visible tab draws on the table: a bot still thinking in "Jouer" waits
 * for its tab to come back.
 */
const replays = wireReplays();

wirePlayer();
wirePlayControls();
wireObserve();
const INPUTS = { play: playInput, puzzles: puzzleInput };
let mode = "play";
/** The table's input goes to the tab on show; the others ignore it. */
const routed = Object.fromEntries(Object.keys(playInput).map((name) => [name, (...args) => (INPUTS[mode] ? INPUTS[mode][name](...args) : undefined)]));
routed.enabled = () => Boolean(INPUTS[mode]?.enabled());
setupInput(routed);
wireSuitBar();
wirePuzzles();

const PANELS = {
  play: ["panel-play"],
  observe: ["panel-observe", "player", "explain"],
  replays: ["panel-replays", "player", "explain"],
  puzzles: ["panel-puzzles"],
};

const EMPTY_MESSAGES = {
  play: "Lance une nouvelle partie.",
  observe: "Choisis deux robots et lance une partie.",
  replays: "Choisis une partie dans la liste.",
  puzzles: "Chargement des puzzles…",
};

function redraw(tab) {
  if (tab === "puzzles") return renderPuzzle();
  const live = tab === "play" ? hasGame() : loaded();
  if (!live) return clearTable(EMPTY_MESSAGES[tab]);
  return tab === "play" ? renderPlay() : renderViewer();
}

function show(tab) {
  mode = tab;
  clearTable(EMPTY_MESSAGES[tab]);
  document.querySelectorAll(".tabs [role=tab]").forEach((button) => button.setAttribute("aria-selected", String(button.dataset.mode === tab)));
  const visible = new Set(PANELS[tab]);
  for (const id of new Set(Object.values(PANELS).flat())) $(id).hidden = !visible.has(id);
  pause();
  setVisible(tab === "play");
  showPuzzles(tab === "puzzles");
  redraw(tab);
  if (tab === "replays") replays.refresh();
}

document.querySelectorAll(".tabs [role=tab]").forEach((tab) => tab.addEventListener("click", () => show(tab.dataset.mode)));
show("play");
openDialog($("dialog-new"));

// `?debug` exposes the play controls, to drive a game from the console or a
// browser-automation tool. Off by default.
if (new URLSearchParams(location.search).has("debug")) window.__lopin = { play: playInput, puzzles: puzzleInput, show };
