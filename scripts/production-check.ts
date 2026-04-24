/**
 * Repo-root entrypoint — runs `apps/web/scripts/production-check.ts` with `apps/web` as cwd.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.join(root, "..", "apps", "web");

const r = spawnSync("npx", ["tsx", "scripts/production-check.ts"], {
  cwd: webRoot,
  stdio: "inherit",
  shell: true,
});

process.exit(r.status === null ? 1 : r.status);
