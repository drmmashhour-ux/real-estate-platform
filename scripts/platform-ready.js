#!/usr/bin/env node
/**
 * Single gate before deployment: system, SYBNB payments, isolation, DR.BRAIN, TypeScript, build.
 * Never prints secrets — delegates to existing guarded scripts only.
 */

const { execSync } = require("child_process");
const path = require("path");

const repoRoot = path.join(__dirname, "..");
process.chdir(repoRoot);

const webRoot = path.join(repoRoot, "apps", "web");
const syriaRoot = path.join(repoRoot, "apps", "syria");

/**
 * @param {string} name
 * @param {string} cmd
 * @param {{ cwd?: string; env?: NodeJS.ProcessEnv }} [opts]
 */
function run(name, cmd, opts = {}) {
  try {
    console.log(`\n▶ ${name}`);
    execSync(cmd, {
      stdio: "inherit",
      cwd: opts.cwd ?? repoRoot,
      env: opts.env ?? process.env,
    });
    console.log(`✅ ${name} passed`);
  } catch {
    console.error(`❌ ${name} failed`);
    process.exit(1);
  }
}

console.log("\n🚀 PLATFORM READY CHECK\n");

// --- ENV GUARD ---
if (!process.env.APP_ENV) {
  console.error("❌ APP_ENV missing");
  process.exit(1);
}

if (process.env.APP_ENV === "production") {
  console.log("⚠️ Running production checks");
  if (process.env.SYBNB_PAYMENTS_KILL_SWITCH === "true") {
    console.error("❌ Kill switch active — not ready");
    process.exit(1);
  }
}

// --- SYSTEM (LECIPM DB + app) ---
run("LECIPM system check", "pnpm system:check", { cwd: webRoot });

// --- PAYMENTS SAFETY (SYBNB) ---
run("SYBNB payments preflight", "pnpm payments:preflight", { cwd: syriaRoot });

// --- ENVIRONMENT ISOLATION ---
run("Environment isolation", "pnpm check:darlink-isolation");

// --- DR.BRAIN ---
run("DrBrain check", "pnpm drbrain:check");

// --- TYPESCRIPT (root has no tsconfig.json — platform lanes only) ---
(() => {
  console.log("\n▶ TypeScript");
  try {
    execSync("pnpm exec tsc --noEmit -p packages/drbrain/tsconfig.json", {
      stdio: "inherit",
      cwd: repoRoot,
      env: process.env,
    });
    execSync("pnpm exec tsc --noEmit -p tsconfig.json", {
      stdio: "inherit",
      cwd: syriaRoot,
      env: { ...process.env, NODE_OPTIONS: "--max-old-space-size=8192" },
    });
    execSync("pnpm exec tsc --noEmit -p tsconfig.json", {
      stdio: "inherit",
      cwd: webRoot,
      env: { ...process.env, NODE_OPTIONS: "--max-old-space-size=16384" },
    });
    console.log("✅ TypeScript passed");
  } catch {
    console.error("❌ TypeScript failed");
    process.exit(1);
  }
})();

// --- BUILD INTEGRITY ---
run("Build", "pnpm build");

console.log("\n🎉 PLATFORM IS READY FOR DEPLOYMENT\n");
process.exit(0);
