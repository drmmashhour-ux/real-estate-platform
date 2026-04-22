import { PlatformRole } from "@prisma/client";

import { getMobileAuthUser } from "@/modules/auth/mobile-auth";
import { loadAdminGlobalBundle } from "@/modules/admin-intelligence/admin-summary.service";
import { getRevenueDashboardData } from "@/modules/dashboard/services/revenue-dashboard.service";

export const dynamic = "force-dynamic";

/** GET /api/mobile/admin/revenue — slim revenue envelope. */
export async function GET(request: Request) {
  const auth = await getMobileAuthUser(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (auth.role !== PlatformRole.ADMIN) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const rev = await getRevenueDashboardData();
    const { global } = await loadAdminGlobalBundle(rev);
    return Response.json({
      series14d: rev.series,
      todayRevenueCents: rev.todayRevenueCents,
      sevenDayAvgCents: rev.sevenDayAverageCents,
      hubs: rev.revenueByHub,
      rolling30dCents: global.totalRevenue30dCents,
      transactions30d: global.transactions30d,
      transactionsToday: rev.transactions,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "revenue_failed";
    return Response.json({ error: msg }, { status: 500 });
  }
}
