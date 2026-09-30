/**
 * The bot line-up players see: in the web game, the replays and `npm run
 * duel`. Each entry names a bot engine id (`engineFor` in `src/sim/bots.js`).
 *
 * Versioning: any change of behaviour bumps the version — patch for a tuned
 * number, minor for a new rule, major for a new way of thinking. Every replay
 * records `id@version`, so games stay comparable across generations.
 */
export const BOT_LINEUP = Object.freeze({
  basique: Object.freeze({
    engine: "greedy",
    version: "1.0.0",
    label: "Basique",
    description: "Le meilleur coup immédiat",
    examines: "tous les coups, un seul coup d'avance",
    pace: "instantané",
  }),
  stratege: Object.freeze({
    engine: "lookahead",
    version: "2.1.0",
    label: "Stratège",
    description: "Tes habitudes et tes idées, et il anticipe",
    examines: "4 coups × 16 fins de partie",
    pace: "≈ 0,5 s par coup",
  }),
  experimental: Object.freeze({
    // 0.8: a tree search over hidden information (src/sim/ismcts.js), measured at 800 iterations a move.
    // The 0.7 search is still the `experimental` engine id, for duels and the bench.
    engine: "ismcts@800",
    version: "0.8.0",
    label: "Expérimental",
    description: "Le cœur du Stratège, qui cherche en arbre",
    examines: "ses 8 meilleurs coups, tes réponses et les siennes, sur 3 coups d'avance ; la fin de partie calculée exactement",
    pace: "jusqu'à 10 s, et pendant ton tour",
    // In the page: a worker, up to limitMs a move, pondering during the human's turn (web/app/thinker.js).
    think: Object.freeze({ limitMs: 10000, minMs: 400 }),
  }),
});

export const BOT_IDS = Object.freeze(Object.keys(BOT_LINEUP));

export const DEFAULT_OPPONENT = "stratege";

/** "stratege@2.1.0": how a bot is named in replays. */
export const botTag = (id) => `${id}@${BOT_LINEUP[id].version}`;

export function engineOf(id) {
  if (!(id in BOT_LINEUP)) throw new Error(`Robot inconnu : « ${id} » (connus : ${BOT_IDS.join(", ")})`);
  return BOT_LINEUP[id].engine;
}
