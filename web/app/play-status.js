/**
 * The line under the table during a game (play.js): settling, over, the
 * human's turn — or the Dame de Cœur waiting for her second border (the
 * extension) — or the bot thinking, with a move programmed or not.
 */
const pendingStatus = (game) => {
  if (game.pending?.action === "discard") return "Valet de Trèfle : choisis une carte en main à défausser (ou reclique sur la borne pour passer).";
  return `Dame de Cœur : choisis la borne à échanger avec la borne ${game.pending.border + 1}.`;
};

export function statusLine(game, humanTurn) {
  if (game.revealing) return "Les bornes se règlent…";
  if (game.state.over) return game.saved ?? "Partie terminée.";
  if (humanTurn && game.pending) return pendingStatus(game);
  if (humanTurn) return "À toi de jouer.";
  return game.premove ? `${game.opponentName} réfléchit… Ton coup est prêt (Échap l'annule).` : `${game.opponentName} réfléchit…`;
}
