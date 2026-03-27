import { updateWatchlistName } from "@/modules/deal-analyzer/infrastructure/services/watchlistService";
import { isDealAnalyzerAlertsEnabled } from "@/modules/deal-analyzer/config";

export async function updateWatchlist(args: { userId: string; watchlistId: string; name: string }) {
  if (!isDealAnalyzerAlertsEnabled()) {
    return { ok: false as const, error: "Deal Analyzer alerts are disabled" };
  }
  const n = await updateWatchlistName({
    watchlistId: args.watchlistId,
    userId: args.userId,
    name: args.name,
  });
  if (n.count === 0) return { ok: false as const, error: "Watchlist not found" };
  return { ok: true as const };
}
