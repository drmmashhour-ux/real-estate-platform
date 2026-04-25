import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const readiness: Record<string, string | boolean> = {
    status: "ok",
    databaseUrl: process.env.DATABASE_URL ? "set" : "missing",
    db: "pending",
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
    // 1. DB (canonical Prisma client; same DATABASE_URL as split clients)
    await prisma.$queryRaw`SELECT 1`;
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

    /** Machine-friendly flag for smoke tests (DB + server up; optional services may be degraded). */
    readiness.ready = readiness.db === "ok";

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
