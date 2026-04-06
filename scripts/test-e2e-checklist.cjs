/**
 * Run from repo root: pnpm test:e2e:checklist
 * Delegates to apps/web (Prisma + DATABASE_URL).
 */
const { spawnSync } = require("node:child_process");
const { resolve, dirname } = require("node:path");

const root = resolve(__dirname, "..");
const web = resolve(root, "apps/web");

const r = spawnSync("pnpm", ["exec", "tsx", "scripts/test-e2e-checklist.ts"], {
  cwd: web,
  stdio: "inherit",
  env: process.env,
  shell: process.platform === "win32",
});

process.exit(r.status ?? 1);
