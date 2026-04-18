/**
 * Market intelligence feed for strategy — lightweight read-only summary (extend with marketplace-intelligence when enabled).
 */
import type { MarketIntelligenceSummary } from "./autonomous-company.types";

export async function buildMarketIntelligenceSummary(): Promise<MarketIntelligenceSummary> {
  return {
    trends: ["Demand signals require tenant-scoped analytics — stub layer."],
    demandSignals: [],
    pricingNotes: [],
    locationNotes: [],
    generatedAt: new Date().toISOString(),
    warnings: ["Wire marketplace-intelligence orchestrator when FEATURE_MARKETPLACE_INTELLIGENCE_V1 and data policy allow."],
  };
}
