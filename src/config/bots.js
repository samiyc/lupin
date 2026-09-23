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
    engine: "strategist",
    version: "1.1.0",
    label: "Stratège",
    description: "Le Basique, plus les habitudes et les idées de Sami. La référence des statistiques.",
  }),
  experimental: Object.freeze({
    engine: "experimental",
    version: "0.2.0",
    label: "Expérimental",
    description: "Banc d'essai des nouvelles idées. Pour l'instant identique au Stratège.",
  }),
});

export const BOT_IDS = Object.freeze(Object.keys(BOT_LINEUP));

export const DEFAULT_OPPONENT = "stratege";

/** "stratege@1.1.0": how a bot is named in replays. */
export const botTag = (id) => `${id}@${BOT_LINEUP[id].version}`;

export function engineOf(id) {
  if (!(id in BOT_LINEUP)) throw new Error(`Robot inconnu : « ${id} » (connus : ${BOT_IDS.join(", ")})`);
  return BOT_LINEUP[id].engine;
}
