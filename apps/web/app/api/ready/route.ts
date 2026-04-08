import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { classifyDbError } from "@/lib/db/db-error-classification";
import { getDatabaseHostHint, getDbHostKind } from "@/lib/db/database-host-hint";
import { withDbRetry } from "@/lib/db/with-db-retry";
import { getPublicEnv } from "@/lib/runtime-env";
import { MESSAGES } from "@/lib/i18n/messages";
import { getResolvedMarket } from "@/lib/markets";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Host:port segment after `@` in DATABASE_URL — debug only; never log full URL. */
function dbTargetHostFromDatabaseUrl(): string | null {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) return null;
  const segment = raw.split("@")[1]?.split("/")[0]?.trim();
  return segment || null;
}

/**
 * Readiness: DB reachable + i18n bundles + market config. Use for load balancers / rollout gates.
 */
export async function GET() {
  const hostHint = getDatabaseHostHint();
  const hostKind = getDbHostKind(hostHint);
  const dbTargetHost = dbTargetHostFromDatabaseUrl() ?? hostHint;
  const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);
  const envName = process.env.NODE_ENV;
  const time = new Date().toISOString();

  if (process.env.VERCEL_DEBUG === "1" || envName === "development") {
    // Never log connection strings — only which env slots are populated.
    console.log("ENV CHECK", {
      DATABASE_URL: !!process.env.DATABASE_URL?.trim(),
      POSTGRES_URL: !!process.env.POSTGRES_URL?.trim(),
      PRISMA_DATABASE_URL: !!process.env.PRISMA_DATABASE_URL?.trim(),
      DB_HOST: hostHint ?? "(unset or unparsable)",
      dbHostKind: hostKind,
      dbTargetHost,
      SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      STRIPE: !!process.env.STRIPE_SECRET_KEY,
      hasOpenAI,
    });
  }

  let dbStatus: "ok" | "failed" = "ok";
  try {
    await withDbRetry(() => prisma.$queryRaw`SELECT 1`, { maxAttempts: 3, baseDelayMs: 200 });
  } catch (e) {
    dbStatus = "failed";
    const c = classifyDbError(e);
    console.error(
      JSON.stringify({
        event: "api_ready_db_failure",
        route: "/api/ready",
        dbErrorKind: c.kind,
        prismaCode: c.code ?? null,
        messageSummary: c.summary,
        dbHostKind: hostKind,
        dbTargetHost,
      })
    );
    return NextResponse.json(
      {
        ok: false,
        ready: false,
        status: "error",
        db: dbStatus,
        dbTargetHost,
        dbHostKind: hostKind,
        hasOpenAI,
        env: envName,
        nodeEnv: envName,
        publicEnv: getPublicEnv(),
        time,
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
    const ok = true;
    return NextResponse.json({
      ok,
      ready: ok,
      status: "ok",
      db: "ok",
      dbTargetHost,
      dbHostKind: hostKind,
      hasOpenAI,
      env: envName,
      nodeEnv: envName,
      publicEnv: getPublicEnv(),
      checks: {
        i18nBundles,
        marketCode: market.code,
      },
      time,
    });
  } catch (e) {
    console.error("[api/ready] non-DB readiness error:", e);
    return NextResponse.json(
      {
        ok: false,
        ready: false,
        status: "error",
        db: "ok",
        dbTargetHost,
        dbHostKind: hostKind,
        hasOpenAI,
        env: envName,
        nodeEnv: envName,
        publicEnv: getPublicEnv(),
        time,
      },
      { status: 503 }
    );
  }
}
