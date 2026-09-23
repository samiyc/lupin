/**
 * The page's side of the replay API served by `npm run play`
 * (`scripts/play-server.js`). Every call reports a readable error.
 */
async function call(path, options) {
  const response = await fetch(path, options);
  if (!response.ok) {
    const detail = await response.json().catch(() => ({}));
    throw new Error(detail.error ?? `Le serveur a répondu ${response.status}`);
  }
  return response.json();
}

export const listReplays = () => call("/api/replays");

export const loadReplay = (dir, name) => call(`/api/replays/${encodeURIComponent(dir)}/${encodeURIComponent(name)}`);

export const saveReplay = (log) =>
  call("/api/replays", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(log) });

export const keepReplay = (name) => call(`/api/replays/recent/${encodeURIComponent(name)}/garder`, { method: "POST" });
