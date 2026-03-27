import { getPortfolioTrustAnalytics } from "@/lib/trustgraph/application/getPortfolioTrustAnalytics";
import type { PortfolioTrustAnalyticsFilter } from "@/lib/trustgraph/domain/portfolio";

export async function loadWorkspacePortfolioAnalytics(workspaceId: string, filter: PortfolioTrustAnalyticsFilter) {
  return getPortfolioTrustAnalytics(workspaceId, filter);
}
