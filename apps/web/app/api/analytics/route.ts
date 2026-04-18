import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { getGrowthRoiAnalytics } from "@/modules/analytics/services/growth-roi-analytics";
import { getGrowthFunnelStats } from "@/modules/analytics/funnel.service";

export const dynamic = "force-dynamic";

/**
 * GET /api/analytics — Growth ROI + funnel (admin only). Query: `days` (1–180, default 30).
 */
export async function GET(req: NextRequest) {
  const s = await requireAdminSession();
  if (!s.ok) {
    return NextResponse.json({ error: s.error }, { status: s.status });
  }
  const raw = req.nextUrl.searchParams.get("days");
  const n = raw ? Number.parseInt(raw, 10) : 30;
  const days = Number.isFinite(n) ? Math.min(180, Math.max(1, n)) : 30;
  const [roi, growthFunnel] = await Promise.all([getGrowthRoiAnalytics(days), getGrowthFunnelStats(days)]);
  return NextResponse.json({ ...roi, growthFunnel });
}
