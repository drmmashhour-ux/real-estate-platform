#!/usr/bin/env node
/**
 * Hosting rollback helper — VERCEL_TOKEN supplied via environment only (never printed).
 */

const { execSync } = require("child_process");

function failManual(msg) {
  console.error("❌", msg);
  console.error("   Perform a manual rollback in your hosting dashboard.");
  process.exit(1);
}

function main() {
  const token = process.env.VERCEL_TOKEN?.trim();
  if (!token) {
    failManual("Rollback unavailable — VERCEL_TOKEN not configured.");
    return;
  }

  console.log("Invoking hosting rollback via CLI (credentials redacted)…");

  try {
    execSync("npx vercel@41 rollback --yes", {
      stdio: "inherit",
      env: {
        ...process.env,
        VERCEL_TOKEN: token,
      },
    });
    console.log("✅ Rollback command finished");
  } catch {
    failManual("Hosting rollback CLI failed.");
  }
}

main();
