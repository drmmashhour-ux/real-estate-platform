import type { WatchlistSummary } from "@/src/modules/watchlist-alerts/domain/watchlist.types";
import { prisma } from "@/lib/db";

export async function getWatchlistSummary(userId: string): Promise<WatchlistSummary> {
  const [watchlists, items, unread, todayChanged, strongUpdates] = await Promise.all([
    prisma.watchlist.count({ where: { userId } }),
    prisma.watchlistItem.count({ where: { watchlist: { userId } } }),
    prisma.watchlistAlert.count({ where: { userId, status: "unread" } }),
    prisma.watchlistAlert.count({ where: { userId, createdAt: { gte: new Date(new Date().toISOString().slice(0, 10)) } } }),
    prisma.watchlistAlert.count({ where: { userId, alertType: "strong_opportunity_detected", status: { not: "dismissed" } } }),
  ]);
  return {
    watchlistCount: watchlists,
    savedListings: items,
    unreadAlerts: unread,
    changedToday: todayChanged,
    strongOpportunityUpdates: strongUpdates,
  };
}
