import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const readiness: Record<string, string> = {
    status: "ok",
    db: "pending",
    stripe: "pending",
    ai: "pending"
  };

  try {
    // 1. DB
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

    return NextResponse.json(readiness);
  } catch (error) {
    return NextResponse.json({
      status: "not_ready",
      error: error instanceof Error ? error.message : "System not ready"
    }, { status: 503 });
  }
}
