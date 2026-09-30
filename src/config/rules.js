/**
 * The rules on the printed sheet, as ids: the 52-card deck without faces
 * (4 × 1-10) plus two colourless jokers, the original order, 7 borders. The
 * web game plays them as printed: a border is claimed as soon as it is proved
 * (`endMode: "claim"`). Replays keep the mode they were played in.
 */
export const OFFICIAL_RULES = Object.freeze({
  deck: "classique",
  jokerRule: "colorless",
  order: "original",
  endMode: "claim",
});
