import { execFileSync } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

/**
 * `npm run pdf`: prints regles/regles.html to regles/regles.pdf with a
 * headless Edge or Chrome — both ship with this machine, so no puppeteer.
 * The page sets its own A4 size and zero margins; the browser's header and
 * footer are switched off.
 */
const CANDIDATES = [
  process.env.CHROME_PATH,
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "/usr/bin/google-chrome",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].filter(Boolean);

const browser = CANDIDATES.find((path) => existsSync(path));
if (!browser) {
  process.stderr.write("Ni Edge ni Chrome trouvé : définissez CHROME_PATH.\n");
  process.exit(1);
}

const source = new URL("../regles/regles.html", import.meta.url);
const target = fileURLToPath(new URL("../regles/regles.pdf", import.meta.url));

execFileSync(browser, [
  "--headless=new",
  "--disable-gpu",
  "--no-pdf-header-footer",
  "--run-all-compositor-stages-before-draw",
  "--virtual-time-budget=8000",
  `--print-to-pdf=${target}`,
  pathToFileURL(fileURLToPath(source)).href,
], { stdio: "ignore" });

const size = existsSync(target) ? statSync(target).size : 0;
if (size === 0) {
  process.stderr.write("Le PDF n'a pas été produit.\n");
  process.exit(1);
}
process.stdout.write(`regles/regles.pdf (${Math.round(size / 1024)} Ko) via ${browser}\n`);
