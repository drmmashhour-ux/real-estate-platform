/**
 * CLI entry for `pnpm run check:isolation` (Node without TypeScript on path).
 * Delegates to `check-isolation.ts`.
 */
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const root = path.join(__dirname, "..");
execFileSync("pnpm", ["exec", "tsx", "scripts/check-isolation.ts"], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});
