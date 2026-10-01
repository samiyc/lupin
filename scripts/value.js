import { readFile, writeFile } from "node:fs/promises";
import { stateAt } from "../src/replay/log.js";
import { createRng } from "../src/core/random.js";
import { borderOdds, rolloutPolicyOf } from "../src/sim/bots.js";
import { EXPERIMENT } from "../src/sim/experimental.js";
import { determinize, playOut } from "../src/sim/lookahead.js";
import { VALUE_FEATURES, independentWin, valueFeatures } from "../src/sim/value.js";

/**
 * `npm run value`: fits the learned value (src/sim/value.js) on self-play.
 * Every position of selfplay/experimental_80.json (run `npm run selfplay`
 * first), seen by the player to move, labelled by who won the game. Four
 * games in five fit a logistic regression; the fifth judges it, by log-loss
 * and Brier score, against the independent estimate alone and against the
 * base rate, phase by phase. The weights go to src/sim/value-weights.js.
 */
const source = new URL("../selfplay/experimental_80.json", import.meta.url);
const target = new URL("../src/sim/value-weights.js", import.meta.url);
const L2 = 1e-3;
const PHASES = [
  { label: "tours 1-14", from: 1, to: 14 },
  { label: "tours 15-29", from: 15, to: 29 },
  { label: "tours 30+", from: 30, to: Infinity },
];

const pointsOf = (winner, player) => (winner === null ? 0.5 : Number(winner === player));

function positionsOf(log, game) {
  const rows = [];
  for (let turn = 1; turn <= log.turns.length; turn += 1) {
    const state = stateAt(log, turn);
    if (state.over) break;
    const odds = borderOdds(state);
    rows.push({ game, turn, state, x: valueFeatures(state, odds), indep: independentWin(odds, state.spec), y: pointsOf(log.result.winner, state.current) });
  }
  return rows;
}

const sigmoid = (z) => 1 / (1 + Math.exp(-z));
const dot = (a, b) => a.reduce((sum, v, i) => sum + v * b[i], 0);

/** Solves `a · x = b` by Gaussian elimination with partial pivoting. */
function solve(a, b) {
  const n = b.length;
  const m = a.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < n; col += 1) {
    const pivot = m.slice(col).reduce((best, row, i) => (Math.abs(row[col]) > Math.abs(m[best][col]) ? col + i : best), col);
    [m[col], m[pivot]] = [m[pivot], m[col]];
    for (let row = 0; row < n; row += 1) {
      if (row === col) continue;
      const factor = m[row][col] / m[col][col];
      for (let k = col; k <= n; k += 1) m[row][k] -= factor * m[col][k];
    }
  }
  return m.map((row, i) => row[n] / row[i]);
}

/** One Newton step of the L2-regularised logistic regression. */
function newtonStep(rows, w) {
  const n = w.length;
  const grad = w.map((wi) => -L2 * rows.length * wi);
  const hess = w.map((_, i) => w.map((__, j) => (i === j ? L2 * rows.length : 0)));
  for (const { x, y } of rows) {
    const p = sigmoid(dot(w, x));
    for (let i = 0; i < n; i += 1) {
      grad[i] += (y - p) * x[i];
      for (let j = 0; j < n; j += 1) hess[i][j] += p * (1 - p) * x[i] * x[j];
    }
  }
  return w.map((wi, i) => wi + solve(hess, grad)[i]);
}

function fit(rows) {
  let w = VALUE_FEATURES.map(() => 0);
  for (let i = 0; i < 12; i += 1) w = newtonStep(rows, w);
  return w;
}

/** Mean log-loss and Brier score of `predict` over `rows`. */
function scores(rows, predict) {
  let loss = 0;
  let brier = 0;
  for (const row of rows) {
    const p = Math.min(1 - 1e-6, Math.max(1e-6, predict(row)));
    loss -= row.y * Math.log(p) + (1 - row.y) * Math.log(1 - p);
    brier += (p - row.y) ** 2;
  }
  return { loss: loss / rows.length, brier: brier / rows.length };
}

const started = performance.now();
const logs = JSON.parse(await readFile(source, "utf8"));
const rows = logs.flatMap(positionsOf);
const train = rows.filter((row) => row.game % 5 !== 0);
const test = rows.filter((row) => row.game % 5 === 0);
const weights = fit(train);
const base = train.reduce((sum, row) => sum + row.y, 0) / train.length;
const predictors = {
  "taux de base": () => base,
  "estimation indépendante": (row) => row.indep,
  "indépendante adoucie (÷4)": (row) => sigmoid(row.x[2]),
  "valeur apprise": (row) => sigmoid(dot(weights, row.x)),
};
const fmt = (x) => x.toFixed(4);
// What one iteration of the tree learns today: the outcome of one rollout, and the mean of eight.
const policy = rolloutPolicyOf(EXPERIMENT)(createRng(7));
const deals = createRng(11);
const rollout = ({ state }) => pointsOf(playOut(determinize(state, state.current, deals), policy), state.current);
const sampled = test.filter((_, i) => i % 4 === 0);
const simulated = sampled.map((row) => ({ ...row, one: rollout(row), eight: Array.from({ length: 8 }, () => rollout(row)).reduce((a, b) => a + b) / 8 }));
predictors["une simulation"] = (row) => row.one;
predictors["8 simulations"] = (row) => row.eight;
console.log(`# Valeur apprise — ${rows.length} positions de ${logs.length} parties (apprises sur ${train.length}, jugées sur ${test.length})\n`);
const phaseHeads = PHASES.map((p) => p.label + " : log-loss / Brier");
console.log(`| Prédicteur | ${phaseHeads.join(" | ")} | Toutes |`);
console.log(`| --- | ${PHASES.map(() => "---").join(" | ")} | --- |`);
for (const [name, predict] of Object.entries(predictors)) {
  const pool = name.includes("simulation") ? simulated : test;
  const cells = [...PHASES.map(({ from, to }) => pool.filter((row) => row.turn >= from && row.turn <= to)), pool].map((part) => scores(part, predict));
  const text = cells.map(({ loss, brier }) => fmt(loss) + " / " + fmt(brier));
  console.log(`| ${name} | ${text.join(" | ")} |`);
}
console.log(`\nPoids : ${VALUE_FEATURES.map((name, i) => name + " " + fmt(weights[i])).join(", ")}`);
const stamp = `${new Date().toISOString().slice(0, 10)}, ${train.length} positions`;
const list = weights.map((w) => Number(w.toFixed(4))).join(", ");
await writeFile(target, `/** Written by \`npm run value\` (${stamp}): the weights of \`VALUE_FEATURES\` (value.js). */\nexport const VALUE_WEIGHTS = Object.freeze([${list}]);\n`);
console.log(`Durée : ${((performance.now() - started) / 1000).toFixed(0)} s`);
