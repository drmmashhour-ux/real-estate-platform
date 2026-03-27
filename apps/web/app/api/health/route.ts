import { NextResponse } from "next/server";
import { getPublicEnv } from "@/lib/runtime-env";

export const dynamic = "force-dynamic";

/**
 * Liveness: process is up. No DB (avoids connection pool noise in probes).
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    env: getPublicEnv(),
    time: new Date().toISOString(),
  });
}
