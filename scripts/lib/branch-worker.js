import { parentPort } from "node:worker_threads";
import { TURNING_TURN, branchFrom, holderAt, reproduces } from "../../src/replay/branch.js";
import { loadGame } from "./game-index.js";

/**
 * One kept game played again from `turn` (`scripts/branch.js`,
 * `scripts/error-impact.js`): `check` says whether the unchanged replay gives
 * back every logged move; otherwise, who holds the game at turn 30 after the
 * change (`force`, `engines`, `reseed`), by exact play from there.
 */
parentPort.on("message", async ({ row, turn, check, force, engines, reseed }) => {
  const log = await loadGame(row);
  if (check) return parentPort.postMessage({ reproduced: reproduces(log, turn) });
  const until = turn <= TURNING_TURN ? TURNING_TURN : Infinity;
  return parentPort.postMessage({ holder: holderAt(branchFrom(log, turn, { force, engines, reseed, until })) });
});
