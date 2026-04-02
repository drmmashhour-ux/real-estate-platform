"use strict";

/**
 * Skip Husky on Vercel / CI so `pnpm install` does not fail when git hooks
 * are unnecessary (Vercel clones are shallow; hooks are not needed for deploy).
 */
const { execSync } = require("node:child_process");

if (process.env.CI === "true" || process.env.VERCEL === "1") {
  process.exit(0);
}

execSync("husky", { stdio: "inherit" });
