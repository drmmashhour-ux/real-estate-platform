/**
 * Runs broker gamification validation from repo root.
 *
 *   pnpm exec tsx scripts/gamification-validation.ts
 */
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const cwd = resolve(process.cwd(), "apps/web");
const r = spawnSync("npx", ["tsx", "scripts/gamification-validation.ts"], {
  cwd,
  stdio: "inherit",
  shell: true,
  env: process.env,
});
process.exit(r.status ?? 1);
