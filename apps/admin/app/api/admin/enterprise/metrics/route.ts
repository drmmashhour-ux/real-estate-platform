import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { requireAdminUser } from "@/modules/analytics/services/require-admin";
import { getEnterpriseMetrics } from "@/lib/enterprise/enterprise-metrics";
import { getGrowthTrackingDashboard } from "@/modules/analytics/services/growth-tracking-dashboard";

export const dynamic = "force-dynamic";

/** Regional marketplace + funnel snapshot for enterprise operations (admin only). */
export async function GET(req: NextRequest) {
  const userId = await getGuestId();
  const admin = await requireAdminUser(userId);
  if (!admin) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const daysRaw = Number(new URL(req.url).searchParams.get("days") ?? "30");
  const days = Number.isFinite(daysRaw) ? Math.max(1, Math.min(180, Math.trunc(daysRaw))) : 30;

  const [enterprise, funnel] = await Promise.all([
    getEnterpriseMetrics(days),
    getGrowthTrackingDashboard(days),
  ]);

  return NextResponse.json({
    rangeDays: days,
    enterprise,
    funnel: {
      visits: funnel.totals.visits,
      signups: funnel.totals.signups,
      revenueCents: funnel.totals.revenueCents,
      conversion: funnel.conversion,
      costs: funnel.costs,
      channels: funnel.channels,
    },
  });
}
