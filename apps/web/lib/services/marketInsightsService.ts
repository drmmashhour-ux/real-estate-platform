import {
  detectMarketInsights,
  generateMarketActions,
  groupMarketInsightsByCity,
  indexHeatmapByCity,
  type CityMarketGroup,
  type MarketAction,
  type MarketInsight,
} from "@/lib/ai/marketInsights";
import { getDemandHeatmap } from "@/lib/market/demandHeatmap";
import { logError } from "@/lib/monitoring/errorLogger";

export type MarketInsightsResponse = {
  insights: MarketInsight[];
  actions: MarketAction[];
  /** Same data grouped by city (dashboards / detail panes). */
  cities: CityMarketGroup[];
  /** Flat string lists for lightweight clients / logs. */
  insightSummaries: string[];
  actionSummaries: string[];
};

/**
 * Raw demand from `getDemandHeatmap` → structured insights, prioritized actions, optional city groups.
 * Fails open (empty) on error so host/dashboard pages can still render.
 */
export async function getMarketInsights(): Promise<MarketInsightsResponse> {
  try {
    const data = await getDemandHeatmap();
    const byCity = indexHeatmapByCity(data);
    const insights = detectMarketInsights(data);
    const actions = generateMarketActions(insights, byCity);
    const cities = groupMarketInsightsByCity(insights, actions);
    return {
      insights,
      actions,
      cities,
      insightSummaries: insights.map((i) => i.message),
      actionSummaries: actions.map((a) => `${a.city}: ${a.suggestion}`),
    };
  } catch (e) {
    logError(e, { service: "getMarketInsights" });
    return { insights: [], actions: [], cities: [], insightSummaries: [], actionSummaries: [] };
  }
}
