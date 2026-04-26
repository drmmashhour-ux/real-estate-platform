import { NextResponse } from "next/server";
import { checkReady } from "@/lib/ready";
import { prismaWithCoreFallback } from "@/lib/db-safe";

export const dynamic = "force-dynamic";

export async function GET() {
  const poolReady = await checkReady();
  const readiness: Record<string, string | boolean> = {
    status: "ok",
    databaseUrl: process.env.DATABASE_URL ? "set" : "missing",
    db: "pending",
    // Order 75 — `pg` `pool` from `@/lib/db` can differ from the Prisma client URL in split-DB scenarios.
    pgPool: poolReady,
    stripe: "pending",
    ai: "pending",
  };

  if (readiness.databaseUrl === "missing") {
    readiness.status = "degraded";
  }
  if (process.env.VERCEL) {
    readiness.runtime = "vercel";
  }

  try {
    // 1. Prisma / modular DB — `USE_NEW_DB=1` tries `db-core` first, falls back to monolith
    await prismaWithCoreFallback((db) => db.$queryRaw`SELECT 1`);
    readiness.db = "ok";

    // 2. Stripe (Basic env check)
    if (process.env.STRIPE_SECRET_KEY) {
      readiness.stripe = "ok";
    } else {
      readiness.stripe = "missing_config";
      readiness.status = "degraded";
    }

    // 3. AI (Basic env check)
    if (process.env.OPENAI_API_KEY) {
      readiness.ai = "ok";
    } else {
      readiness.ai = "missing_config";
      readiness.status = "degraded";
    }

    /**
     * Machine-friendly: Prisma check passed, pool probe passed, and `DATABASE_URL` set.
     * Optional services (Stripe, AI) can still be `missing_config` with `status: degraded`.
     */
    readiness.ready = readiness.db === "ok" && poolReady;

    if (!poolReady) {
      readiness.status = "degraded";
    }

    return NextResponse.json(readiness);
  } catch (error) {
    return NextResponse.json(
      {
        status: "not_ready",
        ready: false,
        error: error instanceof Error ? error.message : "System not ready",
        databaseUrl: process.env.DATABASE_URL ? "set" : "missing",
      },
      { status: 503 }
    );
  }
}
