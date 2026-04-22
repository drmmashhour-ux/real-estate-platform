#!/usr/bin/env node
/**
 * Thin launcher: runs the web-app E2E simulation with correct cwd + TS path aliases.
 *
 *   pnpm exec tsx scripts/e2e-simulation.ts
 *   # or
 *   pnpm e2e-simulation
 */
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const webRoot = resolve(here, "../apps/web");
const r = spawnSync("pnpm", ["exec", "tsx", "scripts/e2e-simulation.ts"], {
  cwd: webRoot,
  stdio: "inherit",
  shell: process.platform === "win32",
  env: process.env,
});
process.exit(r.status ?? 1);
