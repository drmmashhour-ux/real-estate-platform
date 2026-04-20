#!/usr/bin/env npx tsx
/**
 * Final launch gate — validates env, DB, Stripe keys, readiness HTTP (optional), compliance flag.
 *
 *   pnpm --filter @lecipm/web exec tsx scripts/prelaunch-check.ts
 *
 * Env:
 *   PRELAUNCH_BASE_URL — if set (e.g. http://localhost:3001), GET /api/health and /api/ready
 */

import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = resolve(__dirname, "..");

config({ path: resolve(WEB_ROOT, ".env") });
config({ path: resolve(WEB_ROOT, ".env.local") });

function criticalEnvMissing(): string[] {
  const keys = ["DATABASE_URL", "STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"] as const;
  const missing: string[] = [];
  for (const k of keys) {
    if (!process.env[k]?.trim()) missing.push(k);
  }
  return missing;
}

function supabasePublicMissing(): string[] {
  const keys = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"] as const;
  const missing: string[] = [];
  for (const k of keys) {
    if (!process.env[k]?.trim()) missing.push(k);
  }
  return missing;
}

async function main(): Promise<void> {
  const failures: string[] = [];
  const warnings: string[] = [];

  const critical = criticalEnvMissing();
  if (critical.length > 0) failures.push(`Missing critical env: ${critical.join(", ")}`);

  const sb = supabasePublicMissing();
  const requireSb = process.env.PRELAUNCH_REQUIRE_SUPABASE === "1";
  const useFullCore = process.env.PRELAUNCH_FULL_CORE_ENV === "1";
  if (useFullCore && sb.length > 0) {
    failures.push(`Missing env (full core): ${sb.join(", ")}`);
  } else if (requireSb && sb.length > 0) {
    failures.push(`Missing Supabase public env: ${sb.join(", ")}`);
  } else if (sb.length > 0) {
    warnings.push(`Optional (auth/client): missing ${sb.join(", ")} — set for production or export PRELAUNCH_REQUIRE_SUPABASE=1 to fail here.`);
  }

  try {
    const { describeStripeSecretKeyError } = await import("@/lib/stripe/stripeEnvGate");
    const stripeErr = describeStripeSecretKeyError();
    if (stripeErr) failures.push(`Stripe secret key: ${stripeErr}`);
  } catch (e) {
    failures.push(`Stripe env module: ${e instanceof Error ? e.message : String(e)}`);
  }

  try {
    const { prisma } = await import("@/lib/db");
    await prisma.$queryRaw`SELECT 1`;
  } catch (e) {
    failures.push(`Database: ${e instanceof Error ? e.message : String(e)}`);
  }

  try {
    const { complianceFlags } = await import("@/config/feature-flags");
    if (typeof complianceFlags.coownershipEnforcement !== "boolean") {
      failures.push("Compliance flags not loaded");
    }
  } catch (e) {
    failures.push(`Compliance config: ${e instanceof Error ? e.message : String(e)}`);
  }

  const base = process.env.PRELAUNCH_BASE_URL?.trim();
  if (base) {
    try {
      const health = await fetch(`${base.replace(/\/$/, "")}/api/health`, { signal: AbortSignal.timeout(15000) });
      if (!health.ok) failures.push(`GET /api/health HTTP ${health.status}`);
      else {
        const j = (await health.json()) as { status?: string; success?: boolean };
        if (j.status !== "ok" && j.success !== true) failures.push("/api/health body not ok");
      }
    } catch (e) {
      failures.push(`/api/health unreachable: ${e instanceof Error ? e.message : String(e)}`);
    }
    try {
      const ready = await fetch(`${base.replace(/\/$/, "")}/api/ready`, { signal: AbortSignal.timeout(20000) });
      const j = (await ready.json()) as { ready?: boolean; ok?: boolean };
      if (!ready.ok || !j.ready) failures.push(`GET /api/ready not ready (HTTP ${ready.status})`);
    } catch (e) {
      failures.push(`/api/ready unreachable: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  if (failures.length === 0) {
    if (warnings.length > 0) {
      console.warn("\nWARNINGS:\n");
      for (const w of warnings) console.warn(` - ${w}`);
      console.warn("");
    }
    console.log("\nALL SYSTEMS READY\n");
    process.exit(0);
  } else {
    console.error("\nPRELAUNCH CHECK FAILED:\n");
    for (const f of failures) console.error(` - ${f}`);
    console.error("");
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
