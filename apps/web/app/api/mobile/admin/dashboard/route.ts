import { PlatformRole } from "@prisma/client";

import { getMobileAuthUser } from "@/modules/auth/mobile-auth";
import { getAdminSuperDashboardPayload } from "@/modules/admin-intelligence";
import { formatCadCompactFromCents } from "@/modules/dashboard/services/format-dashboard-currency";

export const dynamic = "force-dynamic";

/** GET /api/mobile/admin/dashboard — lightweight intelligence snapshot for admins. */
export async function GET(request: Request) {
  const auth = await getMobileAuthUser(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (auth.role !== PlatformRole.ADMIN) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const payload = await getAdminSuperDashboardPayload();
    return Response.json({
      generatedAt: payload.generatedAt,
      stats: {
        revenueTodayDisplay: formatCadCompactFromCents(payload.revenueTodayCents),
        revenue30dDisplay: formatCadCompactFromCents(payload.global.totalRevenue30dCents),
        bookingsToday: payload.global.bookingsToday,
        leadsToday: payload.global.leadsToday,
        listingsApprox: payload.global.listingsTotalApprox,
        growthPctUser: payload.global.userGrowthPct,
      },
      hubTop: payload.hubPerformance.slice(0, 3),
      insights: payload.insights.slice(0, 5),
      anomalies: payload.anomalies.slice(0, 5),
      activity: payload.recentActivity.slice(0, 8),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "dashboard_failed";
    return Response.json({ error: msg }, { status: 500 });
  }
}
