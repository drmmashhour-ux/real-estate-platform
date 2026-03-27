import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getPublicEnv } from "@/lib/runtime-env";

export const dynamic = "force-dynamic";

/**
 * Readiness: DB reachable. Use for load balancers / rollout gates.
 */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: "ok",
      ready: true,
      env: getPublicEnv(),
      db: "connected",
      time: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      {
        status: "error",
        ready: false,
        env: getPublicEnv(),
        db: "unavailable",
        time: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
