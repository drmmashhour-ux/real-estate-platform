import { captureServerEvent } from "@/lib/analytics/posthog-server";
import { removeListingFromWatchlist } from "@/src/modules/watchlist-alerts/infrastructure/watchlistRepository";

export async function removeFromWatchlist(args: { userId: string; listingId: string }) {
  const out = await removeListingFromWatchlist(args);
  if (out.removedCount > 0) captureServerEvent(args.userId, "watchlist_item_removed", { listingId: args.listingId });
  return out;
}
