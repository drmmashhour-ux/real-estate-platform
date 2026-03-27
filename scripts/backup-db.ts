/**
 * Repo-root entrypoint — runs `apps/web/scripts/backup-db.ts` with the web app `.env`.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const webApp = path.join(root, "apps/web");
const target = path.join(webApp, "scripts/backup-db.ts");

const r = spawnSync("npx", ["tsx", target, ...process.argv.slice(2)], {
  cwd: webApp,
  stdio: "inherit",
  env: process.env,
  shell: process.platform === "win32",
});

process.exit(r.status ?? 1);
