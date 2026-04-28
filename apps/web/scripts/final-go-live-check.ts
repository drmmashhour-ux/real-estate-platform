#!/usr/bin/env npx tsx
/**
 * LECIPM final go-live gate — deterministic, audit-friendly summary.
 *
 * Loads `apps/web/.env` + `.env.local` (same as `prelaunch-check`).
 *
 * Optional env:
 *   PRELAUNCH_BASE_URL — e.g. https://lecipm.com → GET /api/health + /api/ready
 *   FINAL_CHECK_REQUIRE_SUPABASE=1 — fail if NEXT_PUBLIC_SUPABASE_* missing
 *   FINAL_CHECK_SKIP_BUILD_GATE=1 — skip `prisma validate`
 *
 * Usage:
 *   pnpm --filter @lecipm/web exec tsx scripts/final-go-live-check.ts
 */

import { execSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = resolve(__dirname, "..");

config({ path: resolve(WEB_ROOT, ".env") });
config({ path: resolve(WEB_ROOT, ".env.local") });

type Section = "build" | "env" | "api" | "booking" | "stripe" | "compliance";

const status: Record<Section, "OK" | "WARN" | "FAIL" | "SKIP"> = {
  build: "SKIP",
  env: "OK",
  api: "SKIP",
  booking: "SKIP",
  stripe: "OK",
  compliance: "OK",
};
const failures: string[] = [];
const warnings: string[] = [];

function bump(section: Section, level: "OK" | "WARN" | "FAIL") {
  const prev = status[section];
  const rank = { SKIP: 0, OK: 1, WARN: 2, FAIL: 3 };
  if (rank[level] >= rank[prev]) status[section] = level;
}

async function main(): Promise<void> {
  console.log("\n=== LECIPM FINAL GO-LIVE CHECK ===\n");

  // ── BUILD / SCHEMA GATE ────────────────────────────────────────────────────
  if (process.env.FINAL_CHECK_SKIP_BUILD_GATE === "1") {
    bump("build", "SKIP");
    warnings.push("Prisma validate skipped (FINAL_CHECK_SKIP_BUILD_GATE=1).");
  } else {
    try {
      execSync("pnpm exec prisma validate --schema=./prisma/schema.prisma", {
        cwd: WEB_ROOT,
        stdio: "pipe",
        encoding: "utf8",
      });
      bump("build", "OK");
      console.log("BUILD / SCHEMA     OK   (prisma validate)");
    } catch (e) {
      bump("build", "FAIL");
      failures.push(`Prisma validate failed: ${e instanceof Error ? e.message : String(e)}`);
      console.log("BUILD / SCHEMA     FAIL (prisma validate)");
    }
  }

  // ── ENV (production parity) ────────────────────────────────────────────────
  try {
    const { getCoreLaunchEnvMissing } = await import("@/lib/env/core-launch-instrumentation");
    const missing = getCoreLaunchEnvMissing();
    if (missing.length > 0) {
      bump("env", "FAIL");
      failures.push(`Missing core env: ${missing.join(", ")}`);
      console.log(`ENV                FAIL — ${missing.join(", ")}`);
    } else {
      console.log("ENV                OK   (DATABASE_URL, Stripe, NEXT_PUBLIC_SUPABASE_*)");
    }
  } catch (e) {
    bump("env", "FAIL");
    failures.push(`Env module: ${e instanceof Error ? e.message : String(e)}`);
    console.log("ENV                FAIL (could not load core env helper)");
  }

  const sbKeys = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"] as const;
  const sbMissing = sbKeys.filter((k) => !process.env[k]?.trim());
  if (process.env.FINAL_CHECK_REQUIRE_SUPABASE === "1" && sbMissing.length > 0) {
    bump("env", "FAIL");
    failures.push(`Supabase public env required: ${sbMissing.join(", ")}`);
    console.log(`ENV (Supabase)     FAIL — ${sbMissing.join(", ")}`);
  } else if (sbMissing.length > 0) {
    bump("env", "WARN");
    warnings.push(`Optional NEXT_PUBLIC_SUPABASE_* missing (${sbMissing.join(", ")}) — required for auth/client in prod.`);
    console.log(`ENV (Supabase)     WARN — optional keys missing (${sbMissing.join(", ")})`);
  }

  const vercelProd = process.env.VERCEL === "1" && process.env.VERCEL_ENV === "production";
  const sk = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
  if (vercelProd && sk.startsWith("sk_test_")) {
    bump("stripe", "WARN");
    warnings.push("STRIPE_SECRET_KEY is sk_test_ while VERCEL_ENV=production — confirm intentional (staging).");
  }

  // ── STRIPE ─────────────────────────────────────────────────────────────────
  try {
    const { describeStripeSecretKeyError, describeStripeWebhookSecretError } = await import(
      "@/lib/stripe/stripeEnvGate"
    );
    const skErr = describeStripeSecretKeyError();
    const whErr = describeStripeWebhookSecretError();
    if (skErr || whErr) {
      bump("stripe", "FAIL");
      if (skErr) failures.push(`Stripe: ${skErr}`);
      if (whErr) failures.push(`Stripe webhook: ${whErr}`);
      console.log(`STRIPE             FAIL — ${[skErr, whErr].filter(Boolean).join("; ")}`);
    } else {
      console.log("STRIPE             OK   (secret + webhook secret format)");
    }
  } catch (e) {
    bump("stripe", "FAIL");
    failures.push(`Stripe env gate: ${e instanceof Error ? e.message : String(e)}`);
    console.log("STRIPE             FAIL");
  }

  // ── DATABASE (persistence layer) ───────────────────────────────────────────
  if (!process.env.DATABASE_URL?.trim()) {
    bump("booking", "WARN");
    warnings.push("DATABASE_URL missing — skipped DB ping (booking persistence not verified here).");
    console.log("BOOKING / DB       WARN — DATABASE_URL missing (skipped SELECT 1)");
  } else {
    try {
      const { prisma } = await import("@/lib/db");
      await prisma.$queryRaw`SELECT 1`;
      bump("booking", "OK");
      console.log("BOOKING / DB       OK   (SELECT 1)");
    } catch (e) {
      bump("booking", "FAIL");
      failures.push(`Database: ${e instanceof Error ? e.message : String(e)}`);
      console.log("BOOKING / DB       FAIL");
    }
  }

  // ── COMPLIANCE / AUTOPILOT CONFIG ────────────────────────────────────────────
  try {
    const { complianceFlags } = await import("@/config/feature-flags");
    if (typeof complianceFlags.coownershipEnforcement !== "boolean") {
      bump("compliance", "FAIL");
      failures.push("complianceFlags.coownershipEnforcement not loaded");
      console.log("COMPLIANCE         FAIL");
    } else {
      console.log(
        `COMPLIANCE         OK   (coownershipEnforcement=${complianceFlags.coownershipEnforcement}, quebecComplianceV1=${complianceFlags.quebecComplianceV1})`
      );
    }
  } catch (e) {
    bump("compliance", "FAIL");
    failures.push(`Compliance flags: ${e instanceof Error ? e.message : String(e)}`);
    console.log("COMPLIANCE         FAIL");
  }

  // ── HTTP (optional production URL) ─────────────────────────────────────────
  const base = process.env.PRELAUNCH_BASE_URL?.trim();
  if (base) {
    try {
      const root = base.replace(/\/$/, "");
      const health = await fetch(`${root}/api/health`, { signal: AbortSignal.timeout(15000) });
      const ready = await fetch(`${root}/api/ready`, { signal: AbortSignal.timeout(20000) });
      const hBody = health.ok ? ((await health.json()) as { status?: string; success?: boolean }) : {};
      const rBody = ready.ok ? ((await ready.json()) as { ready?: boolean }) : {};
      const healthOk = health.ok && (hBody.status === "ok" || hBody.success === true);
      const readyOk = ready.ok && rBody.ready === true;
      if (!healthOk || !readyOk) {
        bump("api", "FAIL");
        failures.push(
          `Remote checks: /api/health ok=${healthOk} HTTP ${health.status}; /api/ready ready=${readyOk} HTTP ${ready.status}`
        );
        console.log("API (remote)       FAIL (/api/health or /api/ready)");
      } else {
        bump("api", "OK");
        console.log(`API (remote)       OK   (${root}/api/health + /api/ready)`);
      }
    } catch (e) {
      bump("api", "FAIL");
      failures.push(`Remote HTTP: ${e instanceof Error ? e.message : String(e)}`);
      console.log("API (remote)       FAIL");
    }
  } else {
    bump("api", "SKIP");
    warnings.push("PRELAUNCH_BASE_URL unset — skipped remote /api/health + /api/ready.");
    console.log("API (remote)       SKIP (set PRELAUNCH_BASE_URL to verify deployed endpoints)");
  }

  // ── SUMMARY ─────────────────────────────────────────────────────────────────
  console.log("");
  if (warnings.length > 0) {
    console.log("Warnings:");
    for (const w of warnings) console.log(`  • ${w}`);
    console.log("");
  }

  const blocked =
    failures.length > 0 ||
    status.build === "FAIL" ||
    status.env === "FAIL" ||
    status.stripe === "FAIL" ||
    status.booking === "FAIL" ||
    status.compliance === "FAIL" ||
    status.api === "FAIL";

  if (blocked) {
    console.log("FINAL VERDICT      NOT READY FOR LAUNCH\n");
    console.log("Failures:");
    for (const f of failures) console.log(`  • ${f}`);
    console.log("");
    process.exit(1);
  }

  if (warnings.length > 0) {
    console.log("FINAL VERDICT      READY FOR LAUNCH (review warnings above)\n");
    process.exit(0);
  }

  console.log("FINAL VERDICT      READY FOR LAUNCH\n");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
