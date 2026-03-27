import { captureServerEvent } from "@/lib/analytics/posthog-server";
import { prisma } from "@/lib/db";
import { listWatchlistItems } from "@/src/modules/watchlist-alerts/infrastructure/watchlistRepository";
import { listWatchlistAlerts } from "@/src/modules/watchlist-alerts/infrastructure/watchlistAlertRepository";
import { getWatchlistSummary } from "@/src/modules/watchlist-alerts/infrastructure/watchlistSummaryService";

export async function getUserWatchlist(userId: string) {
  const [{ watchlist, items }, alerts, summary] = await Promise.all([
    listWatchlistItems(userId),
    listWatchlistAlerts({ userId, limit: 40 }),
    getWatchlistSummary(userId),
  ]);

  const listingIds = items.map((x) => x.listingId);
  const analyses = listingIds.length
    ? await prisma.dealAnalysis.findMany({
        where: { propertyId: { in: listingIds } },
        distinct: ["propertyId"],
        orderBy: { createdAt: "desc" },
        select: { propertyId: true, investmentScore: true, recommendation: true, confidenceScore: true },
      })
    : [];
  const byListing = new Map(analyses.map((a) => [a.propertyId ?? "", a]));

  captureServerEvent(userId, "watchlist_viewed");

  return {
    watchlist,
    items: items.map((it) => ({
      id: it.id,
      listingId: it.listingId,
      createdAt: it.createdAt,
      listing: {
        ...it.listing,
        dealScore: byListing.get(it.listingId)?.investmentScore ?? null,
        recommendation: byListing.get(it.listingId)?.recommendation ?? null,
        confidence: byListing.get(it.listingId)?.confidenceScore ?? null,
      },
      latestAlert: alerts.find((a) => a.listingId === it.listingId) ?? null,
    })),
    alerts,
    summary,
  };
}
