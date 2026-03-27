import { getPortfolioTrustAnalyticsForWorkspace } from "@/lib/trustgraph/infrastructure/services/portfolioAnalyticsService";
import type { PortfolioTrustAnalyticsFilter } from "@/lib/trustgraph/domain/portfolio";

export async function getPortfolioTrustAnalytics(workspaceId: string, filter: PortfolioTrustAnalyticsFilter) {
  return getPortfolioTrustAnalyticsForWorkspace(workspaceId, filter);
}
