import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getDatabaseHostHint } from "@/lib/db/database-host-hint";
import { getPublicEnv } from "@/lib/runtime-env";
import { MESSAGES } from "@/lib/i18n/messages";
import { getResolvedMarket } from "@/lib/markets";

export const dynamic = "force-dynamic";

/**
 * Readiness: DB reachable + i18n bundles + market config. Use for load balancers / rollout gates.
 */
export async function GET() {
  if (process.env.VERCEL_DEBUG === "1" || process.env.NODE_ENV === "development") {
    const host = getDatabaseHostHint();
    console.log("ENV CHECK", {
      DATABASE_URL: !!process.env.DATABASE_URL,
      DB_HOST: host ?? "(unset or unparsable)",
      SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      STRIPE: !!process.env.STRIPE_SECRET_KEY,
    });
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (e) {
    const host = getDatabaseHostHint();
    console.error("[api/ready] DB ERROR:", e);
    console.error("[api/ready] DB target host (no credentials):", host ?? "(none)");
    return NextResponse.json(
      {
        ok: false,
        status: "error",
        ready: false,
        db: "failed",
        dbTargetHost: host,
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
      db: "connected",
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
        env: getPublicEnv(),
        time: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
