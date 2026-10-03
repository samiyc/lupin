import { cpuLoad, hottest } from "./lib/machine.js";

/**
 * `npm run cooldown -- [minutes] [--max 80]`: a pause between two backlog
 * jobs (Sami, 04/10: not the CPU at full load all night). It waits `minutes`
 * (15 by default), printing the CPU load and the temperature every 5
 * minutes; if a sensor can be read and is still above `--max` °C at the end,
 * it keeps waiting, 5 minutes at a time, up to 30 minutes more. Without a
 * sensor (see scripts/lib/machine.js) the pause is a plain pause, and says so.
 */
const args = process.argv.slice(2);
const minutes = Number(args.find((arg) => /^\d+$/.test(arg)) ?? 15);
const max = Number(args.includes("--max") ? args[args.indexOf("--max") + 1] : 80);
const STEP = 5;
const EXTRA = 30;

const stamp = () => new Date().toTimeString().slice(0, 5);
async function report() {
  const [load, heat] = [await cpuLoad(), await hottest()];
  const temperature = heat ? `${heat.celsius.toFixed(0)} °C (${heat.source})` : "température illisible";
  console.log(`  ${stamp()} : CPU ${(100 * load).toFixed(0)} %, ${temperature}`);
  return heat;
}
const wait = (m) => new Promise((resolve) => setTimeout(resolve, m * 60_000));

console.log(`Pause de ${minutes} min entre deux jobs, au plus ${EXTRA} de plus au-dessus de ${max} °C`);
let heat = await report();
if (!heat) console.log("  aucun capteur lisible (LibreHardwareMonitor les publierait) : simple pause");
for (let waited = 0; waited < minutes; waited += STEP) {
  await wait(Math.min(STEP, minutes - waited));
  heat = await report();
}
for (let extra = 0; heat && heat.celsius > max && extra < EXTRA; extra += STEP) {
  console.log(`  encore chaud : ${STEP} min de plus`);
  await wait(STEP);
  heat = await report();
}
console.log("Fin de la pause.");
