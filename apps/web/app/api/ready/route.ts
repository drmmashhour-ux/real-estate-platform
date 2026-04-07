import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { classifyDbError } from "@/lib/db/db-error-classification";
import { getDatabaseHostHint, getDbHostKind } from "@/lib/db/database-host-hint";
import { withDbRetry } from "@/lib/db/with-db-retry";
import { getPublicEnv } from "@/lib/runtime-env";
import { MESSAGES } from "@/lib/i18n/messages";
import { getResolvedMarket } from "@/lib/markets";

export const dynamic = "force-dynamic";

/**
 * Readiness: DB reachable + i18n bundles + market config. Use for load balancers / rollout gates.
 */
export async function GET() {
  const hostHint = getDatabaseHostHint();
  const hostKind = getDbHostKind(hostHint);

  if (process.env.VERCEL_DEBUG === "1" || process.env.NODE_ENV === "development") {
    console.log("ENV CHECK", {
      DATABASE_URL: !!process.env.DATABASE_URL,
      DB_HOST: hostHint ?? "(unset or unparsable)",
      dbHostKind: hostKind,
      SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      STRIPE: !!process.env.STRIPE_SECRET_KEY,
    });
  }

  try {
    await withDbRetry(() => prisma.$queryRaw`SELECT 1`, { maxAttempts: 3, baseDelayMs: 200 });
  } catch (e) {
    const c = classifyDbError(e);
    console.error(
      JSON.stringify({
        event: "api_ready_db_failure",
        route: "/api/ready",
        dbErrorKind: c.kind,
        prismaCode: c.code ?? null,
        messageSummary: c.summary,
        dbHostKind: hostKind,
        dbTargetHost: hostHint,
      })
    );
    return NextResponse.json(
      {
        ok: false,
        status: "error",
        ready: false,
        db: "failed",
        dbTargetHost: hostHint,
        dbHostKind: hostKind,
        nodeEnv: process.env.NODE_ENV,
        env: getPublicEnv(),
        time: new Date().toISOString(),
      },
      { status: 503 }
    );
  }

  try {
    const i18nBundles =
      Object.keys(MESSAGES.en).length > 0 &&
      Object.keys(MESSAGES.fr).length > 0 &&
      Object.keys(MESSAGES.ar).length > 0;
    const market = await getResolvedMarket();
    return NextResponse.json({
      ok: true,
      status: "ok",
      ready: true,
      env: getPublicEnv(),
      nodeEnv: process.env.NODE_ENV,
      db: "connected",
      dbTargetHost: hostHint,
      dbHostKind: hostKind,
      checks: {
        i18nBundles,
        marketCode: market.code,
      },
      time: new Date().toISOString(),
    });
  } catch (e) {
    console.error("[api/ready] non-DB readiness error:", e);
    return NextResponse.json(
      {
        ok: false,
        status: "error",
        ready: false,
        db: "connected",
        dbTargetHost: hostHint,
        dbHostKind: hostKind,
        nodeEnv: process.env.NODE_ENV,
        env: getPublicEnv(),
        time: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
