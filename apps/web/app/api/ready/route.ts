import { NextResponse } from "next/server";
import { classifyDbError } from "@/lib/db/db-error-classification";
import {
  databaseUrlHasLiteralHostPlaceholder,
  getDatabaseHostHint,
  getDbHostKind,
} from "@/lib/db/database-host-hint";
import { withDbRetry } from "@/lib/db/with-db-retry";
import { getPublicEnv } from "@/lib/runtime-env";
import { MESSAGES } from "@/lib/i18n/messages";
import { getResolvedMarket } from "@/lib/markets";
import { describeStripeSecretKeyError } from "@/lib/stripe/stripeEnvGate";
import { supabaseConfigStatus } from "@/lib/supabase/health";

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
  try {
    return await getReadyHandler();
  } catch (e) {
    console.error(
      JSON.stringify({
        event: "api_ready_unhandled",
        route: "/api/ready",
        message: e instanceof Error ? e.message : String(e),
      })
    );
    return NextResponse.json(
      {
        success: false,
        ok: false,
        ready: false,
        status: "error",
        db: "error",
        stripe: "error",
        api: "error",
        error: "readiness_unhandled",
        time: new Date().toISOString(),
        publicEnv: getPublicEnv(),
      },
      { status: 503 }
    );
  }
}

async function getReadyHandler() {
  const rawDbUrl = process.env.DATABASE_URL || null;
  const dbUrlPreview = rawDbUrl
    ? rawDbUrl
        .replace(/:\/\/.*@/, "://***:***@")
        .replace(/^[^@]+@/, "***:***@")
    : null;
  const rawDbUrlExists = Boolean(rawDbUrl?.trim());

  const hostHint = getDatabaseHostHint();
  const hostKind = getDbHostKind(hostHint);
  const dbTargetHost = dbTargetHostFromDatabaseUrl() ?? hostHint;
  const databaseUrlLooksLikeTemplate =
    hostKind === "placeholder" || databaseUrlHasLiteralHostPlaceholder(rawDbUrl ?? undefined);
  const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);
  const envName = process.env.NODE_ENV;
  const time = new Date().toISOString();
  const projectId = process.env.VERCEL_PROJECT_ID || null;
  const projectName = process.env.VERCEL_PROJECT_PRODUCTION_URL || null;
  const vercelEnv = process.env.VERCEL_ENV || null;

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

  let prisma: Awaited<typeof import("@/lib/db")>["prisma"];
  try {
    ({ prisma } = await import("@/lib/db"));
  } catch (e) {
    console.error(
      JSON.stringify({
        event: "api_ready_prisma_module_failure",
        route: "/api/ready",
        message: e instanceof Error ? e.message : String(e),
        dbHostKind: hostKind,
        dbTargetHost,
      })
    );
    return NextResponse.json(
      {
        success: false,
        ok: false,
        ready: false,
        status: "error",
        db: "error",
        stripe: "not_configured",
        api: "ok",
        dbTargetHost,
        dbHostKind: hostKind,
        databaseUrlLooksLikeTemplate,
        rawDbUrlExists,
        dbUrlPreview,
        projectId,
        projectName,
        vercelEnv,
        hasOpenAI,
        env: envName,
        nodeEnv: envName,
        publicEnv: getPublicEnv(),
        time,
        error: "prisma_module_unavailable",
      },
      { status: 503 }
    );
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
        dbTargetHost,
      })
    );
    return NextResponse.json(
      {
        success: false,
        ok: false,
        ready: false,
        status: "error",
        db: "error",
        stripe: "not_configured",
        api: "ok",
        dbTargetHost,
        dbHostKind: hostKind,
        databaseUrlLooksLikeTemplate,
        rawDbUrlExists,
        dbUrlPreview,
        projectId,
        projectName,
        vercelEnv,
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
    const stripeErr = describeStripeSecretKeyError();
    const stripeReady = !stripeErr;
    const strictStripe =
      (process.env.VERCEL === "1" || process.env.NODE_ENV === "production") &&
      process.env.READY_IGNORE_STRIPE !== "1";
    const coreReady = i18nBundles;
    const ready = coreReady && (stripeReady || !strictStripe);
    const stripeLaunch = stripeReady ? "ok" : stripeErr ? "error" : "not_configured";
    return NextResponse.json(
      {
        success: ready,
        ok: ready,
        ready,
        status: ready ? "ok" : "degraded",
        db: "ok",
        stripe: stripeLaunch,
        api: "ok",
        stripeHint: stripeErr,
        supabase: supabaseConfigStatus(),
        dbTargetHost,
        dbHostKind: hostKind,
        databaseUrlLooksLikeTemplate,
        rawDbUrlExists,
        dbUrlPreview,
        projectId,
        projectName,
        vercelEnv,
        hasOpenAI,
        env: envName,
        nodeEnv: envName,
        publicEnv: getPublicEnv(),
        checks: {
          i18nBundles,
          marketCode: market.code,
          stripeRequired: strictStripe,
        },
        time,
      },
      { status: ready ? 200 : 503 }
    );
  } catch (e) {
    console.error("[api/ready] non-DB readiness error:", e);
    return NextResponse.json(
      {
        success: false,
        ok: false,
        ready: false,
        status: "error",
        db: "ok",
        stripe: "error",
        api: "ok",
        dbTargetHost,
        dbHostKind: hostKind,
        databaseUrlLooksLikeTemplate,
        rawDbUrlExists,
        dbUrlPreview,
        projectId,
        projectName,
        vercelEnv,
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
