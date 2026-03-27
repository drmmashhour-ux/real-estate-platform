/**
 * Repo-root entrypoint for full demo data generation.
 * Delegates to apps/web/scripts/generate-full-demo-data.ts (loads apps/web/.env).
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const webApp = path.join(root, "apps/web");
const target = path.join(webApp, "scripts/generate-full-demo-data.ts");

const r = spawnSync("npx", ["tsx", target, ...process.argv.slice(2)], {
  cwd: webApp,
  stdio: "inherit",
  env: process.env,
  shell: process.platform === "win32",
});

process.exit(r.status ?? 1);
