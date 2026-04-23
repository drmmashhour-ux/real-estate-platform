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
        status: "error",
        db: false,
        api: false,
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
        status: "error",
        db: false,
        api: true,
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
        status: "error",
        db: false,
        api: true,
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
    
    // Privacy check
    const officer = await prisma.privacyOfficer.findFirst({ where: { published: true } });
    const privacyReady = !!officer;

    // Enforce Privacy Officer for Production Launch
    const isStrictPrivacy = (process.env.VERCEL === "1" || process.env.NODE_ENV === "production");
    const privacyOk = privacyReady || !isStrictPrivacy;

    const strictStripe =
      (process.env.VERCEL === "1" || process.env.NODE_ENV === "production") &&
      process.env.READY_IGNORE_STRIPE !== "1";
    
    const coreReady = i18nBundles && privacyOk;
    const ready = coreReady && (stripeReady || !strictStripe);

    // Phase 8: Standardized JSON format
    if (!ready) {
      return NextResponse.json(
        {
          status: "failing",
          db: true,
          api: true,
          error: "core_services_not_ready"
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        status: "ok",
        db: true,
        api: true
      }
    );
  } catch (e) {
    console.error("[api/ready] non-DB readiness error:", e);
    return NextResponse.json(
      {
        status: "error",
        db: true,
        api: false,
        verbose: {
          success: false,
          ready: false,
          db: "ok",
          stripe: "error",
          api: "error",
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
        }
      },
      { status: 503 }
    );
  }
}
