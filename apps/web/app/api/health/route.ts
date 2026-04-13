import { NextResponse } from "next/server";
import { getPublicEnv } from "@/lib/runtime-env";

export const dynamic = "force-dynamic";

/**
 * Liveness: process is up. No DB (avoids connection pool noise in probes).
 * For DB + i18n readiness use GET /api/ready.
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    env: getPublicEnv(),
    time: new Date().toISOString(),
    vercelEnv: process.env.VERCEL_ENV ?? null,
    gitSha: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
  });
}
