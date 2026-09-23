/**
 * Where replay files live and how they are named — the server's only say in
 * the file system, so it is kept pure and tested.
 *
 * - `recent`: every game against a bot, saved automatically (`replays/`,
 *   ignored by git);
 * - `kept`: the ones worth keeping for analysis (`data/replays/`, versioned).
 */
export const REPLAY_DIRS = Object.freeze({ recent: "replays", kept: "data/replays" });

const SAFE_NAME = /^[\w-]+(\.[\w-]+)*\.json$/;

/** A bare file name ending in .json: no folder, no "..", nothing to escape with. */
export const isSafeName = (name) => typeof name === "string" && SAFE_NAME.test(name) && !name.includes("..");

export const isReplayDir = (dir) => Object.hasOwn(REPLAY_DIRS, dir);

const slug = (text) =>
  String(text)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

function playerSlug(player) {
  return slug(player.kind === "human" ? player.name ?? "humain" : player.bot);
}

/** "2026-09-24_10-15-30_humain-vs-stratege.json", from the log's own data. */
export function replayFileName(log) {
  const stamp = log.startedAt.slice(0, 19).replace("T", "_").replaceAll(":", "-");
  const seats = [...log.players].sort((a, b) => a.seat - b.seat).map(playerSlug).join("-vs-");
  return `${stamp}_${seats}.json`;
}

/** What the replay list shows, without sending whole logs. */
export function replayHeader(dir, name, log) {
  return {
    dir,
    name,
    startedAt: log.startedAt,
    players: log.players,
    turns: log.turns.length,
    winner: log.result?.winner ?? null,
    winType: log.result?.winType ?? null,
  };
}
