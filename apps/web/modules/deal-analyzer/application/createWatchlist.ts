import { createWatchlistForUser } from "@/modules/deal-analyzer/infrastructure/services/watchlistService";
import { isDealAnalyzerAlertsEnabled } from "@/modules/deal-analyzer/config";

export async function createWatchlist(args: { userId: string; name: string }) {
  if (!isDealAnalyzerAlertsEnabled()) {
    return { ok: false as const, error: "Deal Analyzer alerts are disabled" };
  }
  if (!args.name?.trim()) return { ok: false as const, error: "Name required" };
  const row = await createWatchlistForUser({ userId: args.userId, name: args.name });
  return { ok: true as const, watchlist: row };
}
