import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { recomputeGrowthFollowUpFlags } from "@/lib/growth/follow-up";
import { getGrowthEngineDashboardMetrics } from "@/lib/growth/metrics";

export const dynamic = "force-dynamic";

/**
 * POST /api/internal/growth/run — stale follow-up flags + metrics snapshot for ops.
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
    const followUp = await recomputeGrowthFollowUpFlags(prisma);
    const metrics = await getGrowthEngineDashboardMetrics(prisma);
    return NextResponse.json({ ok: true, followUp, metrics });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Growth run failed" }, { status: 500 });
  }
}
