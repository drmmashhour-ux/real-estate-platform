"use strict";

/**
 * Skip Husky on Vercel / CI so `pnpm install` does not fail when git hooks
 * are unnecessary (Vercel clones are shallow; hooks are not needed for deploy).
 */
const { execSync } = require("node:child_process");

function truthyEnv(v) {
  if (v == null || v === "") return false;
  const s = String(v).trim().toLowerCase();
  return s === "1" || s === "true" || s === "yes";
}

/** Vercel sets CI=1 (not "true"); without this, husky runs and `pnpm install` exits 1. */
if (truthyEnv(process.env.CI) || truthyEnv(process.env.VERCEL)) {
  process.exit(0);
}

execSync("husky", { stdio: "inherit" });
