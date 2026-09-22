import { DECKS, DECK_IDS, JOKER_RULES, JOKER_RULE_IDS } from "../config/decks.js";
import { ORDERS } from "../config/formations.js";
import { SEED, SIMULATIONS } from "../config/simulations.js";
import { enumerateTriples, inversions, rarityOrder } from "../core/combinatorics.js";
import { createRng } from "../core/random.js";
import { outsTable, sampleStartingHands } from "../core/starting-hand.js";
import { mergeTallies } from "../sim/simulate.js";

/**
 * Everything the reports print, computed here and nowhere else. The build
 * script only adds I/O and the thread pool around these functions.
 */

/** Joker rules only mean something for a deck that has jokers. */
export const rulesFor = (deckId) => (DECKS[deckId].jokers > 0 ? JOKER_RULE_IDS : ["free"]);

function exactFor(deckId, ruleId) {
  return Object.fromEntries(
    Object.entries(ORDERS).map(([orderId, order]) => {
      const counts = enumerateTriples(DECKS[deckId], order, JOKER_RULES[ruleId]);
      return [
        orderId,
        { ...counts, inversions: inversions(counts.best, order), rarity: rarityOrder(counts.best) },
      ];
    }),
  );
}

const byDeckAndRule = (compute) =>
  Object.fromEntries(
    DECK_IDS.map((deckId) => [
      deckId,
      Object.fromEntries(rulesFor(deckId).map((ruleId) => [ruleId, compute(deckId, ruleId)])),
    ]),
  );

export const computeExact = () => byDeckAndRule(exactFor);

export const computeOuts = () =>
  byDeckAndRule((deckId, ruleId) => outsTable(DECKS[deckId], JOKER_RULES[ruleId]));

export function computeStartingHands(samples) {
  let offset = 0;
  return byDeckAndRule((deckId, ruleId) => {
    offset += 1;
    return sampleStartingHands(DECKS[deckId], {
      jokerRule: JOKER_RULES[ruleId],
      samples,
      rng: createRng(SEED + offset),
    });
  });
}

/**
 * Work units for the pool: each simulation row, played greedy against greedy
 * and random against random, cut in chunks so threads stay balanced. Seeds
 * follow the task index, so the merged result does not depend on scheduling.
 */
export function simulationTasks({ games, baselineGames }, chunk = 100) {
  const tasks = [];
  const add = (row, players, total) => {
    for (let played = 0; played < total; played += chunk) {
      tasks.push({ ...row, players, games: Math.min(chunk, total - played), seed: SEED + tasks.length * 7919 });
    }
  };
  for (const row of SIMULATIONS) {
    add(row, ["greedy", "greedy"], games);
    add(row, ["random", "random"], baselineGames);
  }
  const sanity = SIMULATIONS.find((row) => row.deck === "classique");
  add({ ...sanity, id: "sanity" }, ["greedy", "random"], baselineGames);
  add({ ...sanity, id: "sanity" }, ["random", "greedy"], baselineGames);
  return tasks;
}

const matchup = (players) => players.join("-");

/** Merges task results back into one entry per row and matchup. */
export function assembleSimulations(tasks, results) {
  const groups = new Map();
  tasks.forEach((task, i) => {
    const key = `${task.id}|${matchup(task.players)}`;
    if (!groups.has(key)) groups.set(key, { task, tallies: [] });
    groups.get(key).tallies.push(results[i]);
  });
  const out = {};
  for (const { task, tallies } of groups.values()) {
    out[task.id] ??= { deck: task.deck, jokerRule: task.jokerRule, order: task.order };
    out[task.id][matchup(task.players)] = mergeTallies(tallies);
  }
  return out;
}
