#!/usr/bin/env npx tsx
/**
 * Runs typecheck, production build, and Prisma validate — fails on first error.
 *
 *   cd apps/web && pnpm exec tsx scripts/full-validation.ts
 */
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const root = resolve(process.cwd());

function run(label: string, cmd: string, args: string[]): boolean {
  console.log(`\n[full-validation] ${label}…`);
  const r = spawnSync(cmd, args, {
    cwd: root,
    stdio: "inherit",
    shell: false,
    env: { ...process.env, NODE_OPTIONS: process.env.NODE_OPTIONS ?? "--max-old-space-size=8192" },
  });
  if (r.status !== 0) {
    console.error(`[full-validation] FAILED: ${label} (exit ${r.status})`);
    return false;
  }
  console.log(`[full-validation] OK ${label}`);
  return true;
}

function main(): void {
  const pnpm = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
  if (!run("prisma validate", pnpm, ["run", "prisma:validate"])) process.exit(1);
  if (!run("typecheck", pnpm, ["run", "typecheck"])) process.exit(1);
  if (!run("build", pnpm, ["run", "build"])) process.exit(1);
  console.log("\n[full-validation] All steps passed.");
}

main();
