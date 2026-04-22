/**
 * Runs AI CEO validation from repo root (cwd = apps/web).
 *
 *   pnpm exec tsx scripts/ceo-validation.ts
 */
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const cwd = resolve(process.cwd(), "apps/web");
const r = spawnSync("npx", ["tsx", "scripts/ceo-validation.ts"], {
  cwd,
  stdio: "inherit",
  shell: true,
  env: process.env,
});
process.exit(r.status ?? 1);
