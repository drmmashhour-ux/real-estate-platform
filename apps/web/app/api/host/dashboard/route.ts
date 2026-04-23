import { prisma } from "@repo/db";
import { getGuestId } from "@/lib/auth/session";
import { ListingAnalyticsKind } from "@prisma/client";
import { logError } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * GET /api/host/dashboard — FSBO host aggregate + billing summary (no secrets).
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

    const [sub, overview] = await Promise.all([
      prisma.subscription.findFirst({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        select: {
          planCode: true,
          status: true,
          currentPeriodEnd: true,
          cancelAtPeriodEnd: true,
          stripeSubscriptionId: true,
        },
      }),
      (async () => {
        if (ids.length === 0) {
          return {
            listingCount: 0,
            totalViews: 0,
            totalSaves: 0,
            totalLeads: 0,
          };
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
        return {
          listingCount: ids.length,
          totalViews: Math.max(views, aggViews),
          totalSaves: Math.max(saves, aggSaves),
          totalLeads: leads,
        };
      })(),
    ]);

    return Response.json({
      ok: true,
      overview,
      workspaceSubscription: sub
        ? {
            planCode: sub.planCode,
            status: sub.status,
            currentPeriodEnd: sub.currentPeriodEnd?.toISOString() ?? null,
            cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
            hasStripeSubscription: Boolean(sub.stripeSubscriptionId),
          }
        : null,
    });
  } catch (e) {
    logError("host_dashboard_root_failed", { userId, err: e });
    return Response.json({ error: "Unable to load dashboard" }, { status: 500 });
  }
}
