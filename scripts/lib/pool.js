import os from "node:os";
import { Worker } from "node:worker_threads";

/**
 * How many worker threads to run: every logical core but one, or
 * `LOPIN_THREADS` when set — to keep a laptop cool, or the machine usable while
 * a job runs (docs/cloud.md).
 */
export function workerCount() {
  const asked = Number(process.env.LOPIN_THREADS);
  return asked > 0 ? Math.floor(asked) : Math.max(1, os.cpus().length - 1);
}

/**
 * Runs `tasks` on a pool of worker threads, one task at a time per worker,
 * and resolves with the results in task order — so the output does not
 * depend on which thread finished first.
 *
 * `onResult(result, index)` sees each result as it lands (to write it at
 * once); `shouldStop()`, asked before each new task, lets a long run end on
 * time: the tasks under way finish, the rest are left out (undefined).
 */
export function runPool(workerUrl, tasks, { onProgress = () => {}, onResult = () => {}, shouldStop = () => false } = {}) {
  const threads = Math.max(1, Math.min(tasks.length, workerCount()));
  const results = new Array(tasks.length);
  let next = 0;
  let done = 0;
  let live = 0;
  return new Promise((resolve, reject) => {
    const finish = (worker) => {
      worker.terminate();
      live -= 1;
      if (live === 0) resolve(results);
    };
    const feed = (worker) => {
      if (next >= tasks.length || shouldStop()) return finish(worker);
      const index = next;
      next += 1;
      worker.once("message", (result) => {
        results[index] = result;
        done += 1;
        onResult(result, index);
        onProgress(done, tasks.length);
        feed(worker);
      });
      worker.postMessage(tasks[index]);
      return worker;
    };
    for (let t = 0; t < threads; t += 1) {
      const worker = new Worker(workerUrl);
      live += 1;
      worker.on("error", reject);
      feed(worker);
    }
  });
}
