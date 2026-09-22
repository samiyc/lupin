import os from "node:os";
import { Worker } from "node:worker_threads";

/**
 * Runs `tasks` on a pool of worker threads, one task at a time per worker,
 * and resolves with the results in task order — so the output does not
 * depend on which thread finished first.
 */
export function runPool(workerUrl, tasks, { onProgress = () => {} } = {}) {
  const threads = Math.max(1, Math.min(tasks.length, os.cpus().length - 1));
  const results = new Array(tasks.length);
  let next = 0;
  let done = 0;
  return new Promise((resolve, reject) => {
    const feed = (worker) => {
      if (next >= tasks.length) return worker.terminate();
      const index = next;
      next += 1;
      worker.once("message", (result) => {
        results[index] = result;
        done += 1;
        onProgress(done, tasks.length);
        if (done === tasks.length) resolve(results);
        feed(worker);
      });
      worker.postMessage(tasks[index]);
      return worker;
    };
    for (let t = 0; t < threads; t += 1) {
      const worker = new Worker(workerUrl);
      worker.on("error", reject);
      feed(worker);
    }
  });
}
