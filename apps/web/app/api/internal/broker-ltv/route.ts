import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { isRevenueAnalyticsEnabled } from "@/lib/feature-flags/revenue-growth";
import { getBrokerLtvPanelStats } from "@/modules/monetization/revenue-loop.service";

export const dynamic = "force-dynamic";

/** GET — repeat rate, ARPB, top spenders (admin; same flag as /api/internal/revenue). */
export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  if (!isRevenueAnalyticsEnabled()) {
    return NextResponse.json(
      { error: "Revenue analytics disabled", feature: "REVENUE_ANALYTICS_ENABLED" },
      { status: 503 }
    );
  }
  try {
    const data = await getBrokerLtvPanelStats(90);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}
