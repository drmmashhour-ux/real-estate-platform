import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { isRevenueAnalyticsEnabled } from "@/lib/feature-flags/revenue-growth";
import { fetchRevenueMetrics } from "@/modules/revenue/infrastructure/revenueService";

export const dynamic = "force-dynamic";

/** GET — MRR, churn, LTV (admin-only; feature-flagged). */
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
    const data = await fetchRevenueMetrics();
    return NextResponse.json(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to load revenue metrics";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
