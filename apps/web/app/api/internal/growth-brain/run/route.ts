import { NextRequest, NextResponse } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { runGrowthBrainEngine } from "@/lib/growth-brain/engine";

export const dynamic = "force-dynamic";

/**
 * POST /api/internal/growth-brain/run — snapshot, score, recommend, persist.
 * Authorization: Bearer CRON_SECRET
 */
export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ error: "Cron not configured" }, { status: 503 });
  }
  const auth = request.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (token !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runGrowthBrainEngine(prisma);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Growth brain run failed" }, { status: 500 });
  }
}
