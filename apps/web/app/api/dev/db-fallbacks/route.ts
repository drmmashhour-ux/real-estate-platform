import { NextResponse } from "next/server";

import { getFallbacks } from "@/lib/db-fallback-log";

export const dynamic = "force-dynamic";

/**
 * In-memory log of Prisma core → monolith fallbacks (see `safeQuery` in `lib/db-safe.ts`).
 * Disabled in production unless `ENABLE_DB_FALLBACK_LOG_API=1` (avoid leaking migration state).
 */
export async function GET() {
  if (process.env.NODE_ENV === "production" && process.env.ENABLE_DB_FALLBACK_LOG_API !== "1") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(getFallbacks());
}
