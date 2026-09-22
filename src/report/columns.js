import { FORMATION_LABELS } from "../config/formations.js";

/**
 * The decks the static tables compare, left to right. The two 42-card
 * proposals each appear twice: with a free joker and with a colourless one,
 * since that rule is what the study turns on.
 */
export const COLUMNS = Object.freeze([
  { key: "original", deck: "original", rule: "free", head: "Original", sub: "6×9" },
  { key: "rapide", deck: "rapide", rule: "free", head: "Rapide", sub: "6×7" },
  { key: "classique", deck: "classique", rule: "free", head: "4 coul.", sub: "joker libre" },
  { key: "classiqueColorless", deck: "classique", rule: "colorless", head: "4 coul.", sub: "joker s. coul." },
  { key: "tarot", deck: "tarot", rule: "free", head: "Tarot", sub: "joker libre" },
  { key: "tarotColorless", deck: "tarot", rule: "colorless", head: "Tarot", sub: "joker s. coul." },
]);

/** The simulated variants the profile chart shows, in reading order. */
export const PROFILE_ROWS = Object.freeze([
  { id: "original-free-original", label: "Original 6×9" },
  { id: "rapide-free-original", label: "Rapide 6×7" },
  { id: "classique-free-original", label: "4 coul., joker libre" },
  { id: "classique-onePerBorder-original", label: "4 coul., 1 joker/borne" },
  { id: "classique-colorless-original", label: "4 coul., joker s. coul." },
  { id: "tarot-free-original", label: "Tarot, joker libre" },
  { id: "tarot-colorless-original", label: "Tarot, joker s. coul." },
]);

export const RANK_NAMES = ["1re", "2e", "3e", "4e", "Somme"];

export const label = (formation) => FORMATION_LABELS[formation];
