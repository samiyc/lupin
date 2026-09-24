/**
 * The bot line-up players see: in the web game, the replays and `npm run
 * duel`. Each entry names a bot engine (`BOTS` in `src/sim/bots.js`).
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
    description: "Joue la carte qui vaut le plus à l'instant T.",
  }),
  stratege: Object.freeze({
    engine: "lookahead",
    version: "2.1.0",
    label: "Stratège",
    description: "Les habitudes et les idées de Sami, et avant chaque coup il rejoue la fin de partie pour ses meilleures options.",
  }),
  experimental: Object.freeze({
    engine: "experimental",
    version: "0.5.0",
    label: "Expérimental",
    description: "Le cœur du Stratège, qui cherche plus loin : jusqu'à 10 s par coup, et il réfléchit pendant ton tour.",
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
