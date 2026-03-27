import { captureServerEvent } from "@/lib/analytics/posthog-server";
import { addListingToWatchlist } from "@/src/modules/watchlist-alerts/infrastructure/watchlistRepository";

export async function addToWatchlist(args: { userId: string; listingId: string }) {
  const out = await addListingToWatchlist(args);
  if (out.created) captureServerEvent(args.userId, "watchlist_item_added", { listingId: args.listingId });
  return out;
}
