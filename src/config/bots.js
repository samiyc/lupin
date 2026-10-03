/**
 * The bot line-up players see: in the web game, the replays and `npm run
 * duel`. Each entry names a bot engine id (`engineFor` in `src/sim/bots.js`).
 *
 * Versioning (Sami, 03/10): two numbers, major.minor — minor for any change
 * of behaviour, major for a new way of thinking. A version only moves once
 * the change is validated (long duels on several deck sets), so the third
 * number a tuned value used to take never served: games saved before it
 * still carry it, always 0, and `shortTag` reads them as the same version.
 * Every replay records `id@version`, so games stay comparable across
 * generations.
 */
export const BOT_LINEUP = Object.freeze({
  basique: Object.freeze({
    engine: "greedy",
    version: "1.0",
    label: "Basique",
    description: "Le meilleur coup immédiat",
    examines: "tous les coups, un seul coup d'avance",
    pace: "instantané",
  }),
  stratege: Object.freeze({
    engine: "lookahead",
    version: "2.1",
    label: "Stratège",
    description: "Il anticipe",
    examines: "4 coups × 16 fins de partie",
    pace: "≈ 0,5 s par coup",
  }),
  experimental: Object.freeze({
    // 1.0: the 0.9's tree with the stfig core (oracle-ideas.js): it stays on its started sides while they
    // can still become trips or a suited run — the oracle's habit, 56.1 % (53.2-59.1) over 480 deck pairs.
    // The 0.9 is `ismcts+widen=3+depth=5@800`, the 0.8 `ismcts@800`.
    engine: "ismcts+widen=3+depth=5+core=stfig6@800",
    version: "1.0",
    label: "Expérimental",
    description: "Il cherche en arbre",
    examines: "5 coups d'avance, la fin de partie calculée exactement",
    pace: "jusqu'à 10 s, et pendant ton tour",
    // In the page: a worker, up to limitMs a move, pondering during the human's turn (web/app/thinker.js).
    think: Object.freeze({ limitMs: 10000, minMs: 400 }),
  }),
});

export const BOT_IDS = Object.freeze(Object.keys(BOT_LINEUP));

/**
 * The versions still shown — in the Elo table and the Stats tab — three at
 * most per bot (Sami, merlin-is-dead): with the human players, ten rows at
 * most. Older versions' games still count in the Elo fit; their engines are
 * in git history.
 */
export const KEPT_VERSIONS = Object.freeze({
  basique: Object.freeze(["1.0"]),
  stratege: Object.freeze(["2.1", "2.0", "1.1"]),
  experimental: Object.freeze(["1.0", "0.9", "0.8"]),
});

/** "2.1.0" → "2.1": the version a game saved with three numbers stands for. */
export function shortVersion(version) {
  const parts = String(version).split(".");
  return parts.length === 3 && parts[2] === "0" ? `${parts[0]}.${parts[1]}` : String(version);
}

/** "stratege@2.1.0" → "stratege@2.1"; humans and engine ids ("ismcts…@800") are left as they are. */
export function shortTag(tag) {
  const at = tag.lastIndexOf("@");
  return at < 0 ? tag : `${tag.slice(0, at)}@${shortVersion(tag.slice(at + 1))}`;
}

/** How a logged bot (`{ bot, version }`, the web game's way) is named: "stratege@2.1". */
export const playerTag = (player) => `${player.bot}@${shortVersion(player.version)}`;

/** Is `player` ("Sami", "stratege@2.1") one to show? Humans always are. */
export function isShownPlayer(player) {
  const [id, version] = shortTag(player).split("@");
  return version === undefined || Boolean(KEPT_VERSIONS[id]?.includes(version));
}

export const DEFAULT_OPPONENT = "stratege";

/** "stratege@2.1": how a bot is named in replays. */
export const botTag = (id) => `${id}@${BOT_LINEUP[id].version}`;

export function engineOf(id) {
  if (!(id in BOT_LINEUP)) throw new Error(`Robot inconnu : « ${id} » (connus : ${BOT_IDS.join(", ")})`);
  return BOT_LINEUP[id].engine;
}
