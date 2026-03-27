import { captureServerEvent } from "@/lib/analytics/posthog-server";
import { captureWatchlistSnapshot } from "@/src/modules/watchlist-alerts/application/captureWatchlistSnapshot";
import { createAlertsFromComparison } from "@/src/modules/watchlist-alerts/infrastructure/watchlistAlertService";
import { listWatchlistItems } from "@/src/modules/watchlist-alerts/infrastructure/watchlistRepository";

export async function generateWatchlistAlerts(args: { userId: string; listingId?: string }) {
  const { watchlist, items } = await listWatchlistItems(args.userId);
  const targets = args.listingId ? items.filter((x) => x.listingId === args.listingId) : items;

  const createdAlerts: any[] = [];

  for (const item of targets) {
    const { comparison } = await captureWatchlistSnapshot(args.userId, item.listingId);
    if (!comparison.hasChanges) continue;
    const created = await createAlertsFromComparison({
      userId: args.userId,
      watchlistId: watchlist.id,
      listingId: item.listingId,
      comparison,
    });
    createdAlerts.push(...created);
  }

  captureServerEvent(args.userId, "watchlist_refresh_triggered", {
    checkedListings: targets.length,
    generatedAlerts: createdAlerts.length,
  });

  return { checkedListings: targets.length, generatedAlerts: createdAlerts.length, alerts: createdAlerts };
}
