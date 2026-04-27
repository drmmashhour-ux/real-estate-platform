/**
 * One-command preflight before enabling SYBNB payments. Does not enable payments.
 * Run: cd apps/syria && pnpm payments:preflight
 * Loads `.env` and `.env.local` (later overrides). Never prints DATABASE_URL or secrets.
 * Exit code: 0 only when every check passes; otherwise 1.
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const APP_ROOT = path.join(__dirname, "..");

function loadEnvFiles() {
  for (const name of [".env", ".env.local"]) {
    const p = path.join(APP_ROOT, name);
    if (!fs.existsSync(p)) continue;
    const text = fs.readFileSync(p, "utf8");
    for (const line of text.split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const idx = t.indexOf("=");
      if (idx < 1) continue;
      const k = t.slice(0, idx).trim();
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(k)) continue;
      let v = t.slice(idx + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      process.env[k] = v;
    }
  }
}

loadEnvFiles();

function run(cmd) {
  try {
    console.log(`\n▶ ${cmd}`);
    execSync(cmd, { stdio: "inherit", cwd: APP_ROOT, shell: true, env: process.env });
    return true;
  } catch {
    return false;
  }
}

function fail(msg) {
  console.error(`\n❌ ${msg}`);
  process.exit(1);
}

function ok(msg) {
  console.log(`\n✅ ${msg}`);
}

function prodDbRequiresSsl(urlStr) {
  const lower = urlStr.toLowerCase();
  return (
    /\bsslmode=require\b/.test(lower) ||
    /\bsslmode=verify-full\b/.test(lower) ||
    /\bsslmode=verify-ca\b/.test(lower)
  );
}

console.log("\n🚀 PAYMENTS PREFLIGHT CHECK\n");

const env = process.env;

if (!env.APP_ID) fail("APP_ID missing (set APP_ID=syria for this app)");
if (!env.APP_ENV) fail("APP_ENV missing (e.g. development | staging | production)");

if (env.APP_ID !== "syria") {
  fail("Wrong APP_ID for SYBNB");
}

if (env.APP_ENV === "production") {
  if (!env.DATABASE_URL) fail("Missing DATABASE_URL");

  const u = env.DATABASE_URL;
  if (u.includes("localhost") || u.includes("127.0.0.1")) {
    fail("Production DB cannot be local");
  }

  if (!prodDbRequiresSsl(u)) {
    fail("Production DATABASE_URL must declare sslmode=require (or verify-ca / verify-full) for remote Postgres");
  }
}

ok("Environment validated");

/**
 * Mirrors `sybnb.config.ts`: production lock is ENGAGED unless `SYBNB_PRODUCTION_LOCK_MODE === "false"`.
 * Live card rails require unlocking explicitly — fail if someone enables payments while lock is still engaged.
 */
const sybnbLockEngaged = env.SYBNB_PRODUCTION_LOCK_MODE !== "false";
const paymentsFlagOn = env.SYBNB_PAYMENTS_ENABLED === "true";

if (paymentsFlagOn && sybnbLockEngaged) {
  fail(
    "SYBNB_PAYMENTS_ENABLED=true while SYBNB production lock is still engaged — set SYBNB_PRODUCTION_LOCK_MODE=false only after sandbox checklist (see docs/payment-activation-checklist.md)",
  );
}

if (env.APP_ENV === "production" && env.SYBNB_PRODUCTION_LOCK_MODE === "false" && !paymentsFlagOn) {
  console.warn(
    "⚠️ Production has SYBNB_PRODUCTION_LOCK_MODE=false but SYBNB_PAYMENTS_ENABLED is not true — verify this deploy is intentionally unlocked for infra/tests only.",
  );
}

if (env.SYBNB_PAYMENTS_ENABLED !== "true") {
  console.warn("⚠️ SYBNB_PAYMENTS_ENABLED is not true — card rails stay off until explicitly enabled");
}

/** Required whenever targeting production APP_ENV or enabling SYBNB payments — enforced in payment-intent route too. */
const paymentsSurfaceActive = env.APP_ENV === "production" || paymentsFlagOn;
if (paymentsSurfaceActive && env.SYBNB_PAYMENT_IDEMPOTENCY_REQUIRED !== "true") {
  fail(
    "SYBNB_PAYMENT_IDEMPOTENCY_REQUIRED must be true — prevents double charges / replay (required when APP_ENV=production or SYBNB_PAYMENTS_ENABLED=true)",
  );
}

if (env.SYBNB_PAYMENTS_KILL_SWITCH === "true") {
  fail("SYBNB_PAYMENTS_KILL_SWITCH is ON — disable kill switch before payments preflight passes");
}

ok("Payment safety gates OK (kill-switch OFF; SYBNB lock & idempotency rules)");

console.warn(
  "\n⚠️ Manual verification before go-live: exercise kill switch against checkout in staging — config ≠ observed blocking behavior.\n",
);

if (!run("pnpm exec prisma generate --schema=./prisma/schema.prisma")) {
  fail("Prisma generate failed");
}

if (!env.DATABASE_URL?.trim()) {
  fail("DATABASE_URL is required for the DB connectivity check");
}

if (!run("pnpm run test-db")) {
  fail("Database connection failed");
}

ok("Database OK");

if (!run("pnpm exec tsc --noEmit")) {
  fail("TypeScript errors found");
}

ok("TypeScript OK");

if (!run("pnpm run build")) {
  fail("Build failed");
}

ok("Build OK");

if (env.SYBNB_ESCROW_ENABLED === "false") {
  fail("Escrow must remain enabled — unset SYBNB_ESCROW_ENABLED or set it true (SYBNB_ESCROW_ENABLED=false is blocked)");
}

if (env.SYBNB_AUTO_RELEASE_PAYOUTS === "true") {
  fail("Auto payout release must NOT be enabled (SYBNB_AUTO_RELEASE_PAYOUTS=true)");
}

ok("Escrow safety OK");

const provider = (env.SYBNB_PAYMENT_PROVIDER ?? "manual").toLowerCase();
if (provider === "stripe") {
  const hasStripeSecret = Boolean(
    (env.STRIPE_WEBHOOK_SECRET && String(env.STRIPE_WEBHOOK_SECRET).trim()) ||
      (env.SYBNB_STRIPE_WEBHOOK_SECRET && String(env.SYBNB_STRIPE_WEBHOOK_SECRET).trim()),
  );
  if (!hasStripeSecret) {
    fail("Stripe provider requires STRIPE_WEBHOOK_SECRET or SYBNB_STRIPE_WEBHOOK_SECRET");
  }
}

ok("Webhook config OK");

console.log("\n🎉 ALL PREFLIGHT CHECKS PASSED — SAFE TO PROCEED\n");
process.exit(0);
