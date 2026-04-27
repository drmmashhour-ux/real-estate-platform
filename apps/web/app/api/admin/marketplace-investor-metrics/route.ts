import { requireAdminSession } from "@/lib/admin/require-admin";
import { getMarketplaceInvestorMetricsSnapshot } from "@/lib/marketplace/investorMetrics";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/marketplace-investor-metrics — **admin** marketplace GMV, fees, nights, net fee after refunds.
 * Order 65. Query: `from` and `to` (ISO YYYY-MM-DD) optional — filter on booking `startDate`.
 */
export async function GET(req: Request) {
  const admin = await requireAdminSession();
  if (!admin.ok) {
    return Response.json({ error: admin.error }, { status: admin.status });
  }

  const u = new URL(req.url);
  const fromS = u.searchParams.get("from")?.trim().slice(0, 10);
  const toS = u.searchParams.get("to")?.trim().slice(0, 10);
  const from = fromS && !Number.isNaN(Date.parse(fromS)) ? new Date(fromS) : undefined;
  const to = toS && !Number.isNaN(Date.parse(toS)) ? new Date(toS) : undefined;
  if ((fromS && !from) || (toS && !to)) {
    return Response.json({ error: "Invalid from or to date" }, { status: 400 });
  }

  const m = await getMarketplaceInvestorMetricsSnapshot(
    from || to ? { from, to } : undefined
  );

  return Response.json({
    ...m,
    gmv: m.gmvCents / 100,
    platformRevenue: m.platformFeeCents / 100,
    netPlatformRevenue: m.netPlatformFeeCents / 100,
    totalRefunded: m.totalRefundedCents / 100,
    averageBookingValue: m.averageBookingValueCents != null ? m.averageBookingValueCents / 100 : null,
  });
}
