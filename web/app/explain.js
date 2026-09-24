import { formatThinking } from "./clock.js";
import { $, el } from "./dom.js";
import { playerName } from "./runner.js";

/**
 * The "why this move" panel of the observer and the replays: the hand, the
 * move and the border it went to, and the bot's best candidates — or, for a
 * human move, what the strategist would have played.
 */
const gain = (value) => value.toFixed(3).replace(".", ",");

function sideText(side) {
  const mine = side.wasEmpty ? "borne vide" : `sa ligne : ${side.mine.join(" ")}`;
  const theirs = side.theirs.length === 0 ? "rien en face" : `en face : ${side.theirs.join(" ")}`;
  return `${mine} ; ${theirs}${side.completes ? " — il la complète" : ""}`;
}

function candidateList(title, candidates, move) {
  if (!candidates || candidates.length === 0) return [];
  const items = candidates.map((c) => {
    const chosen = move && c.card === move.card && c.border === move.border;
    return el("li", { class: chosen ? "chosen" : "" }, `${c.card} → borne ${c.border} · ${gain(c.gain)}`);
  });
  return [el("p", {}, title), el("ol", {}, ...items)];
}

function adviceVerdict({ adviceGap, refused }) {
  if (refused) return "Le Stratège ne pose jamais un joker hors d'une paire : pas d'écart mesurable.";
  if (adviceGap === null || adviceGap === undefined) return null;
  return adviceGap < 1e-9 ? "Même choix que le Stratège." : `Écart avec le meilleur coup du Stratège : ${gain(adviceGap)}`;
}

function adviceParts(frame, move) {
  const verdict = adviceVerdict(frame);
  return [...(verdict ? [el("p", {}, verdict)] : []), ...candidateList("Le Stratège aurait joué :", frame.advice, move)];
}

export function renderExplain(log, frame) {
  const box = $("explain");
  const entry = frame?.entry;
  if (!entry) {
    box.replaceChildren(el("p", {}, "Début de partie : les deux mains viennent d'être distribuées."));
    return;
  }
  const who = playerName(log.players[entry.player]);
  const parts = [el("h3", {}, `Tour ${entry.turn} — ${who}`), el("p", {}, `Main : ${entry.hand.join(" ")}`)];
  if (entry.pass) {
    parts.push(el("p", {}, "Passe : aucun coup possible."));
  } else {
    const took = typeof entry.thinkMs === "number" ? ` en ${formatThinking(entry.thinkMs)}` : "";
    parts.push(el("p", {}, `Joue ${entry.move.card} sur la borne ${entry.move.border}${took} (${sideText(entry.side)}).`));
    parts.push(el("p", {}, entry.drew ? `Pioche : ${entry.drew}` : "Pioche vide."));
  }
  parts.push(...candidateList("Ses meilleures options :", entry.candidates, entry.move));
  parts.push(...adviceParts(frame, entry.move));
  box.replaceChildren(...parts);
}
