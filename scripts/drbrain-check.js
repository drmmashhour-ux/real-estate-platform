#!/usr/bin/env node
/**
 * Shim so `node scripts/drbrain-check.js` runs the TS orchestrator via tsx (pnpm-aware cwd).
 */
const { spawnSync } = require("node:child_process");
const path = require("node:path");

const repoRoot = path.join(__dirname, "..");
const ts = path.join(repoRoot, "scripts", "drbrain-check.ts");

const r = spawnSync(process.platform === "win32" ? "pnpm.cmd" : "pnpm", ["exec", "tsx", ts], {
  cwd: repoRoot,
  stdio: "inherit",
  shell: false,
  env: process.env,
});

process.exit(typeof r.status === "number" ? r.status : 1);
