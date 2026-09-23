import { BOT_IDS, BOT_LINEUP, DEFAULT_OPPONENT } from "../../src/config/bots.js";
import { finishLog, playLogged, snapshot, startLog } from "../../src/replay/log.js";
import { legalMoves } from "../../src/sim/game.js";
import { $, el, freshSeed, recall, remember, toast, wait } from "./dom.js";
import { moveCard, sortBySuit, sortByValue, syncOrder } from "./hand.js";
import { saveReplay } from "./replays-api.js";
import { RULES, SPEC, botEntry, botPlayer, humanEntry, newGame, playBot, playerName } from "./runner.js";
import { clearTable, renderTable } from "./table.js";
import { tableView } from "./view.js";

/**
 * "Jouer": the human against a bot of the line-up, on the official rules.
 * Borders are settled only once every card is down, then revealed one by one
 * in the order they filled. The game's log is saved when it ends — never
 * after "Recommencer". One game at a time, so its state lives here.
 */
const BOT_DELAY = 700;
const REVEAL_DELAY = 650;

const play = { game: null, generation: 0, visible: true };

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

export function render() {
  const { game } = play;
  if (game === null || !play.visible) return;
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
  finishLog(game.log, game.state);
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

async function botTurns(id) {
  while (alive(id) && active() && !humanTurn()) {
    render();
    await wait(BOT_DELAY);
    if (!alive(id)) return;
    const player = play.game.state.current;
    afterMove(player, playBot(play.game.log, play.game.state, play.game.bot));
  }
  if (alive(id) && play.game.state.over) await finish(id);
}

export function playCard(index, border) {
  if (!legalFor(index).has(border)) return;
  const { game } = play;
  afterMove(game.human, playLogged(game.log, game.state, { card: game.order[index], border }));
  botTurns(play.generation);
}

export function start({ first, opponent, name }) {
  play.generation += 1;
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
    log: startLog(state, { rules: RULES, players, seed }),
    order: sortBySuit(SPEC, state.hands[human]),
    selected: null,
    shown: 0,
    lastMove: null,
    revealing: false,
    saved: null,
  };
  render();
  botTurns(play.generation);
}

/** Drops the game in progress; nothing is saved. */
export function abandon() {
  play.generation += 1;
  play.game = null;
  if (play.visible) clearTable("Partie abandonnée, rien n'a été enregistré.");
}

export const hasGame = () => play.game !== null;

/** Only the visible tab may draw on the shared table. */
export function setVisible(visible) {
  play.visible = visible;
}

function wireReset(newDialog) {
  const confirm = $("dialog-reset");
  $("btn-reset").addEventListener("click", () => (active() ? confirm.showModal() : newDialog.showModal()));
  confirm.addEventListener("close", () => {
    if (confirm.returnValue !== "reset") return;
    abandon();
    newDialog.showModal();
  });
}

function reorderWith(transform) {
  if (!active()) return;
  play.game.order = transform(play.game.order);
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
  $("btn-new").addEventListener("click", () => dialog.showModal());
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
  reorder: (from, to) => reorderWith((order) => moveCard(order, from, to)),
  legalFor,
};
