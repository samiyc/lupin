/**
 * The line under the table during a game (play.js): settling, over, the
 * human's turn — or the Dame de Cœur waiting for her second border (the
 * extension) — or the bot thinking, with a move programmed or not.
 */
const pendingStatus = (game) => {
  if (game.pending?.action === "discard") return "Valet de Trèfle : choisis une carte en main à défausser (ou reclique sur la borne pour passer).";
  return `Dame de Cœur : choisis la borne à échanger avec la borne ${game.pending.border + 1}.`;
};

const humanStatus = (game, canPass) => {
  if (game.pending) return pendingStatus(game);
  return canPass ? "Aucun coup possible : passe ton tour." : "À toi de jouer.";
};

const opponentStatus = (game) => (game.premove ? `${game.opponentName} réfléchit… Ton coup est prêt (Échap l'annule).` : `${game.opponentName} réfléchit…`);

export function statusLine(game, humanTurn, canPass = false) {
  if (game.revealing) return "Les bornes se règlent…";
  if (game.state.over) return game.saved ?? "Partie terminée.";
  return humanTurn ? humanStatus(game, canPass) : opponentStatus(game);
}
