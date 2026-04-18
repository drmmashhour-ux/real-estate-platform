import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { ListingAnalyticsKind } from "@prisma/client";
import { logError } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * GET /api/host/dashboard/overview — FSBO seller aggregate stats (real queries only).
 */
export async function GET() {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });

  try {
  const listings = await prisma.fsboListing.findMany({
    where: { ownerId: userId },
    select: { id: true },
  });
  const ids = listings.map((l) => l.id);
  if (ids.length === 0) {
    return Response.json({
      ok: true,
      listingCount: 0,
      totalViews: 0,
      totalSaves: 0,
      totalLeads: 0,
    });
  }

  const [views, saves, leads, analytics] = await Promise.all([
    prisma.buyerListingView.count({ where: { fsboListingId: { in: ids } } }),
    prisma.buyerSavedListing.count({ where: { fsboListingId: { in: ids } } }),
    prisma.fsboLead.count({ where: { listingId: { in: ids } } }),
    prisma.listingAnalytics.findMany({
      where: { kind: ListingAnalyticsKind.FSBO, listingId: { in: ids } },
      select: { viewsTotal: true, saves: true },
    }),
  ]);

  const aggViews = analytics.reduce((a, r) => a + r.viewsTotal, 0);
  const aggSaves = analytics.reduce((a, r) => a + r.saves, 0);

  return Response.json({
    ok: true,
    listingCount: ids.length,
    totalViews: Math.max(views, aggViews),
    totalSaves: Math.max(saves, aggSaves),
    totalLeads: leads,
    note:
      "Views/saves may double-count if both raw events and listing_analytics are populated — use listing-level drill-down for accuracy.",
  });
  } catch (e) {
    logError("host_dashboard_overview_failed", { userId, err: e });
    return Response.json({ error: "Unable to load dashboard" }, { status: 500 });
  }
}
