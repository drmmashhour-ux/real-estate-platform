import { NextRequest, NextResponse } from "next/server";
import { describeStripeSecretKeyError } from "@/lib/stripe/stripeEnvGate";
import { getPublicEnv } from "@/lib/runtime-env";
import { withDbRetry } from "@/lib/db/with-db-retry";
import { getSupabaseHealth, supabaseConfigStatus } from "@/lib/supabase/health";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function appVersion(): string {
  return (
    process.env.APP_VERSION?.trim() ??
    process.env.npm_package_version ??
    process.env.NEXT_PUBLIC_APP_VERSION?.trim() ??
    "0.1.0"
  );
}

function stripeReadiness(): "ready" | "not_configured" | "invalid" {
  const err = describeStripeSecretKeyError();
  if (!err) return "ready";
  if (!process.env.STRIPE_SECRET_KEY?.trim()) return "not_configured";
  return "invalid";
}

/**
 * GET /api/health
 *
 * - Default: liveness + config snapshot (minimal DB usage for cheap probes).
 * - `?deep=1`: checks DB connectivity + Stripe env (use for post-deploy validation, not high-frequency LB pings).
 *
 * For full readiness (i18n, market) use GET /api/ready.
 */
export async function GET(req: NextRequest) {
  const deep = req.nextUrl.searchParams.get("deep") === "1";
  const version = appVersion();
  const gitSha = process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GIT_COMMIT ?? null;
  const stripe = stripeReadiness();

  if (!deep) {
    return NextResponse.json({
      status: "ok",
      db: "not_checked",
      database: "not_checked",
      stripe,
      supabase: supabaseConfigStatus(),
      version,
      gitSha,
      env: getPublicEnv(),
      time: new Date().toISOString(),
      vercelEnv: process.env.VERCEL_ENV ?? null,
      hint: "Use /api/health?deep=1 for DB ping; /api/ready for full readiness.",
    });
  }

  let db: "connected" | "failed" = "connected";
  try {
    const { prisma } = await import("@/lib/db");
    await withDbRetry(() => prisma.$queryRaw`SELECT 1`, { maxAttempts: 2, baseDelayMs: 150 });
  } catch {
    db = "failed";
  }

  const supabase = await getSupabaseHealth(true);
  const ok = db === "connected" && stripe !== "invalid";
  const status = ok ? "ok" : "degraded";

  const dbLabel = db === "connected" ? "connected" : "failed";

  return NextResponse.json(
    {
      status,
      db: dbLabel,
      database: dbLabel,
      stripe,
      supabase,
      version,
      gitSha,
      time: new Date().toISOString(),
      vercelEnv: process.env.VERCEL_ENV ?? null,
    },
    { status: status === "ok" ? 200 : 503 },
  );
}
