import { prisma } from "@/lib/db";
import { createAlert } from "@/lib/monitoring/alerts";

/**
 * Periodic checks for monitoring watchlist bookmarks (FSBO listings + metrics-backed “deal” scores).
 * Does not place offers or execute trades.
 */
export async function runWatchlistChecks(ownerType: string, ownerId: string) {
  const items = await prisma.monitoringWatchlistItem.findMany({
    where: { ownerType, ownerId },
  });

  for (const item of items) {
    if (item.watchType === "deal_candidate") {
      const metrics = await prisma.fsboListingMetrics.findUnique({
        where: { fsboListingId: item.referenceId },
      });
      if (!metrics) continue;

      const dealScore = metrics.dealScore;
      if (typeof item.currentScore === "number" && dealScore > item.currentScore + 10) {
        await createAlert({
          ownerType,
          ownerId,
          alertType: "score_change",
          severity: "info",
          title: "Deal score improved",
          message: `${item.title ?? "Watched listing"} model score moved from ${item.currentScore} toward ${dealScore} (advisory).`,
          referenceType: "fsbo_listing_metrics",
          referenceId: item.referenceId,
        });
        await prisma.monitoringWatchlistItem.update({
          where: { id: item.id },
          data: { currentScore: dealScore },
        });
      } else if (item.currentScore == null) {
        await prisma.monitoringWatchlistItem.update({
          where: { id: item.id },
          data: { currentScore: dealScore },
        });
      }
    }

    if (item.watchType === "listing") {
      const listing = await prisma.fsboListing.findUnique({
        where: { id: item.referenceId },
      });
      if (!listing) continue;

      const lastPrice = item.lastPriceCents;
      if (lastPrice != null && listing.priceCents < lastPrice) {
        await createAlert({
          ownerType,
          ownerId,
          alertType: "price_drop",
          severity: "high",
          title: "Price drop detected",
          message: `${item.title ?? "Watched listing"} shows a lower ask (advisory — not a mandate to purchase).`,
          referenceType: "listing",
          referenceId: item.referenceId,
          metadata: {
            previousPriceCents: lastPrice,
            currentPriceCents: listing.priceCents,
          },
        });
      }
      await prisma.monitoringWatchlistItem.update({
        where: { id: item.id },
        data: { lastPriceCents: listing.priceCents },
      });
    }
  }
}
