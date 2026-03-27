import { isDealAnalyzerPortfolioMonitoringEnabled } from "@/modules/deal-analyzer/config";
import { runPortfolioMonitoringForWatchlist } from "@/modules/deal-analyzer/infrastructure/services/portfolioMonitoringService";

export async function monitorInvestorPortfolio(args: { watchlistId: string; userId: string }) {
  if (!isDealAnalyzerPortfolioMonitoringEnabled()) {
    return { ok: false as const, error: "Portfolio monitoring disabled" };
  }
  return runPortfolioMonitoringForWatchlist(args);
}
