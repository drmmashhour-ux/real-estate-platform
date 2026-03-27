import { listAlertsForWatchlist, listAlertsForUser } from "@/modules/deal-analyzer/infrastructure/services/portfolioAlertService";
import { isDealAnalyzerAlertsEnabled } from "@/modules/deal-analyzer/config";

export async function listPortfolioAlertsForUser(userId: string) {
  if (!isDealAnalyzerAlertsEnabled()) return null;
  return listAlertsForUser(userId);
}

export async function listPortfolioAlertsForWatchlist(args: { userId: string; watchlistId: string }) {
  if (!isDealAnalyzerAlertsEnabled()) return null;
  return listAlertsForWatchlist(args.watchlistId, args.userId);
}
