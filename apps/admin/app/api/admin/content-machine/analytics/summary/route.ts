import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { getStylePerformanceRollup } from "@/lib/content-machine/analytics";
import {
  contentMachinePerformanceScore,
  getTopPerformingMachineContent,
} from "@/lib/content-machine/performance";

export const dynamic = "force-dynamic";

/**
 * Deep performance snapshot: per-style rollups + top pieces (with style tags).
 */
export async function GET(req: Request) {
  const admin = await requireAdminSession();
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const url = new URL(req.url);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 30, 1), 100);

  const [byStyle, topByScore] = await Promise.all([
    getStylePerformanceRollup(),
    getTopPerformingMachineContent({ limit, orderBy: "score" }),
  ]);

  return NextResponse.json({
    byStyle,
    top: topByScore.map((r) => ({
      id: r.id,
      style: r.style,
      hook: r.hook,
      views: r.views,
      clicks: r.clicks,
      conversions: r.conversions,
      score: contentMachinePerformanceScore(r.views, r.clicks, r.conversions),
      listing: r.listing,
    })),
  });
}
