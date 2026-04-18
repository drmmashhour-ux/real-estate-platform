import type { FounderIntelligenceSnapshot } from "../founder-intelligence/founder-intelligence.types";
import type { CompanyInsight } from "./company-insights.types";
import { synthesizeInsightsFromIntelligence } from "./insight-synthesis.engine";

export async function buildCompanyInsights(
  snapshot: FounderIntelligenceSnapshot,
): Promise<{ insights: CompanyInsight[]; generatedAt: string }> {
  const insights = synthesizeInsightsFromIntelligence(snapshot);
  return { insights, generatedAt: new Date().toISOString() };
}
