import { BOT_IDS, BOT_LINEUP, DEFAULT_OPPONENT } from "../../src/config/bots.js";
import { $, el, openDialog, recall, remember } from "./dom.js";

/**
 * The "Nouvelle partie" and "Recommencer" dialogs of the "Jouer" panel.
 * `game`: `{ start({ first, opponent, name }), abandon(), active() }`.
 */
export function wireGameDialogs(game) {
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
    game.start({ first: form.get("first"), opponent: form.get("opponent"), name });
  });
  $("btn-new").addEventListener("click", () => openDialog(dialog));
  const confirm = $("dialog-reset");
  $("btn-reset").addEventListener("click", () => openDialog(game.active() ? confirm : dialog));
  confirm.addEventListener("close", () => {
    if (confirm.returnValue !== "reset") return;
    game.abandon();
    openDialog(dialog);
  });
}
