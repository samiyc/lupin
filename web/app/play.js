import { BOT_IDS, BOT_LINEUP, DEFAULT_OPPONENT } from "../../src/config/bots.js";
import { finishLog, playLogged, snapshot, startLog } from "../../src/replay/log.js";
import { legalMoves } from "../../src/sim/game.js";
import { clockLine, createClock, watchFocus } from "./clock.js";
import { $, el, freshSeed, openDialog, recall, remember, toast, wait } from "./dom.js";
import { clearDrag } from "./drag.js";
import { moveCard, sortBySuit, sortByValue, syncOrder } from "./hand.js";
import { saveReplay } from "./replays-api.js";
import { RULES, SPEC, botEntry, botPlayer, humanEntry, newGame, playerName } from "./runner.js";
import { createThinker } from "./thinker.js";
import { clearTable, renderTable } from "./table.js";
import { tableView } from "./view.js";

/**
 * "Jouer": the human against a bot of the line-up, on the official rules.
 * Borders are settled only once every card is down, then revealed one by one
 * in the order they filled. The game's log is saved when it ends — never
 * after "Recommencer". One game at a time, so its state lives here.
 *
 * Each human move is timed (`thinkMs` in the log) by a clock that stops
 * while the page is hidden or out of focus, or the "Jouer" tab is not shown.
 */
/** How long a bot turn lasts at least; its thinking time counts toward it. */
const BOT_DELAY = 700;
const PAINT = 30;
const REVEAL_DELAY = 650;

const play = { game: null, generation: 0, visible: true, syncFocus: () => {} };

const alive = (id) => play.game !== null && id === play.generation;
const active = () => play.game !== null && !play.game.state.over;
const humanTurn = () => active() && play.game.state.current === play.game.human;

function status() {
  const { game } = play;
  if (game.revealing) return "Les bornes se règlent…";
  if (game.state.over) return game.saved ?? "Partie terminée.";
  return humanTurn() ? "À toi de jouer." : `${game.opponentName} réfléchit…`;
}

export function legalFor(index) {
  if (!humanTurn()) return new Set();
  const card = play.game.order[index];
  return new Set(legalMoves(play.game.state).filter((move) => move.card === card).map((move) => move.border));
}

function renderClock() {
  if (play.game !== null && play.visible) $("clock").textContent = clockLine(play.game.clock, { humanTurn: humanTurn(), over: play.game.state.over });
}

export function render() {
  const { game } = play;
  if (game === null || !play.visible) return;
  renderClock();
  const view = tableView(SPEC, snapshot(game.state), { bottom: game.human, handOrder: game.order, shown: game.shown, lastMove: game.lastMove });
  renderTable(view, {
    status: status(),
    names: { bottom: game.name, top: game.opponentName },
    interactive: active(),
    selected: game.selected,
    legalBorders: game.selected === null ? new Set() : legalFor(game.selected),
    lastMove: game.lastMove,
    showTools: true,
  });
}

function afterMove(player, entry) {
  const { game } = play;
  game.order = syncOrder(game.order, game.state.hands[game.human]);
  game.lastMove = entry.move ? { border: entry.move.border - 1, side: player === game.human ? "bottom" : "top" } : null;
  game.selected = null;
  render();
}

async function save(id) {
  try {
    const saved = await saveReplay(play.game.log);
    if (!alive(id)) return;
    play.game.saved = `Partie enregistrée : ${saved.path}`;
    toast(play.game.saved);
  } catch (error) {
    if (alive(id)) play.game.saved = `Replay non enregistré (${error.message}).`;
  }
  render();
}

async function finish(id) {
  const { game } = play;
  game.clock.pause();
  finishLog(game.log, game.state);
  game.log.result.activeMs = Math.round(game.clock.active());
  game.revealing = true;
  for (game.shown = 0; game.shown < game.state.resolved.length; game.shown += 1) {
    render();
    await wait(REVEAL_DELAY);
    if (!alive(id)) return;
  }
  game.revealing = false;
  game.shown = Infinity;
  render();
  await save(id);
}

/** One bot move: paint "réfléchit…", think, then let the rest of `BOT_DELAY` pass. */
async function botTurn(id) {
  render();
  const started = performance.now();
  await wait(PAINT);
  if (!alive(id)) return;
  const { game } = play;
  const { move, scored } = await game.thinker.decide(game.state, game.log);
  await wait(Math.max(0, BOT_DELAY - (performance.now() - started)));
  if (!alive(id)) return;
  const player = game.state.current;
  afterMove(player, playLogged(game.log, game.state, move, scored));
}

async function botTurns(id) {
  while (alive(id) && active() && !humanTurn()) await botTurn(id);
  if (!alive(id)) return;
  if (humanTurn()) {
    play.game.clock.mark();
    play.game.thinker.ponder(play.game.log);
  }
  else if (play.game.state.over) await finish(id);
}

/**
 * Where the card of `grip` sits now: its own index if the card is still
 * there, else wherever it went, else null. A grip without a card (a click on
 * the current selection) is taken at its word.
 */
function locate({ index, card }) {
  const { order } = play.game;
  if (card === undefined || order[index] === card) return index;
  const found = order.indexOf(card);
  return found === -1 ? null : found;
}

export function playCard(grip, border) {
  if (!active()) return;
  const index = locate(grip);
  if (index === null || !legalFor(index).has(border)) return;
  const { game } = play;
  const thinkMs = Math.round(game.clock.mark());
  const entry = playLogged(game.log, game.state, { card: game.order[index], border });
  entry.thinkMs = thinkMs;
  afterMove(game.human, entry);
  botTurns(play.generation);
}

export function start({ first, opponent, name }) {
  play.generation += 1;
  clearDrag();
  play.game?.thinker.stop();
  const seed = freshSeed();
  const state = newGame(seed);
  const human = first === "me" ? 0 : 1;
  const players = [humanEntry(human, name), botEntry(1 - human, opponent)].sort((a, b) => a.seat - b.seat);
  play.game = {
    state,
    human,
    name,
    opponentName: playerName(botEntry(1 - human, opponent)),
    bot: botPlayer(opponent, seed + 1),
    thinker: createThinker(botPlayer(opponent, seed + 1), BOT_LINEUP[opponent].think, seed + 1),
    log: startLog(state, { rules: RULES, players, seed }),
    order: sortBySuit(SPEC, state.hands[human]),
    selected: null,
    shown: 0,
    lastMove: null,
    revealing: false,
    saved: null,
    clock: createClock(() => performance.now()),
  };
  play.syncFocus();
  render();
  botTurns(play.generation);
}

/** Drops the game in progress; nothing is saved. */
export function abandon() {
  play.generation += 1;
  clearDrag();
  play.game?.thinker.stop();
  play.game = null;
  if (play.visible) {
    clearTable("Partie abandonnée, rien n'a été enregistré.");
    $("clock").textContent = "";
  }
}

export const hasGame = () => play.game !== null;

/** Only the visible tab may draw on the shared table. */
export function setVisible(visible) {
  play.visible = visible;
  $("clock").textContent = "";
  if (!visible) play.game?.clock.pause();
  else play.syncFocus();
}

function wireReset(newDialog) {
  const confirm = $("dialog-reset");
  $("btn-reset").addEventListener("click", () => openDialog(active() ? confirm : newDialog));
  confirm.addEventListener("close", () => {
    if (confirm.returnValue !== "reset") return;
    abandon();
    openDialog(newDialog);
  });
}

/** Rearranges the hand; a selected card stays selected wherever it lands. */
function reorderWith(transform) {
  if (!active() || !play.visible) return;
  const { game } = play;
  const picked = game.selected === null ? null : game.order[game.selected];
  game.order = transform(game.order);
  if (picked !== null) game.selected = game.order.indexOf(picked);
  render();
}

/** The dialogs and buttons of the "Jouer" panel. */
export function wirePlayControls() {
  $("opponents").append(
    ...BOT_IDS.map((id) =>
      el("label", {}, el("input", { type: "radio", name: "opponent", value: id, checked: id === DEFAULT_OPPONENT }), ` ${BOT_LINEUP[id].label} `, el("small", {}, BOT_LINEUP[id].description)),
    ),
  );
  $("player-name").value = recall("lopin.name", "Joueur");
  const dialog = $("dialog-new");
  dialog.addEventListener("close", () => {
    if (dialog.returnValue !== "start") return;
    const form = new FormData($("form-new"));
    const name = String(form.get("name") ?? "").trim() || "Joueur";
    remember("lopin.name", name);
    start({ first: form.get("first"), opponent: form.get("opponent"), name });
  });
  $("btn-new").addEventListener("click", () => openDialog(dialog));
  play.syncFocus = watchFocus(() => (active() && play.visible ? play.game.clock : null), renderClock);
  setInterval(renderClock, 1000);
  wireReset(dialog);
  $("sort-suit").addEventListener("click", () => reorderWith((order) => sortBySuit(SPEC, order)));
  $("sort-value").addEventListener("click", () => reorderWith((order) => sortByValue(SPEC, order)));
}

/**
 * Input controller for `drag.js`: the hand can be arranged at any time during
 * a game; a card can only be played on the human's turn (`legalFor` is empty
 * otherwise).
 */
export const playInput = {
  enabled: () => play.visible && active(),
  selected: () => play.game?.selected ?? null,
  select(index) {
    play.game.selected = index;
    render();
  },
  play: playCard,
  reorder(grip, to) {
    const from = active() ? locate(grip) : null;
    if (from !== null) reorderWith((order) => moveCard(order, from, to));
  },
  legalFor,
  /** For `?debug`: how the thinker reached its last answer (time pondered, rollouts, time thought). */
  thinking: () => play.game?.thinker.last ?? null,
};
