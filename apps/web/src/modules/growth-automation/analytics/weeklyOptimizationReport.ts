import { buildOptimizationBundleFromRows } from "@/src/modules/growth-automation/analytics/generateOptimizationRecommendations";
import { analyzePerformanceTaxonomy } from "@/src/modules/growth-automation/analytics/performanceTaxonomyAnalysis";
import { CHANNEL_CONTENT_NOTES } from "@/src/modules/growth-automation/domain/contentTaxonomy";
import type { GrowthMarketingPlatform } from "@prisma/client";
import { listPerformanceForOptimization } from "@/src/modules/growth-automation/infrastructure/growthAutomationRepository";

export type WeeklyOptimizationReport = {
  weekStart: string;
  generatedAt: string;
  summary: string;
  taxonomyInsights: Awaited<ReturnType<typeof analyzePerformanceTaxonomy>>;
  recommendations: Awaited<ReturnType<typeof buildOptimizationBundleFromRows>>;
  channelNotes: Record<GrowthMarketingPlatform, string>;
};

export async function buildWeeklyOptimizationReport(args: { weekStart: string }): Promise<WeeklyOptimizationReport> {
  const rows = await listPerformanceForOptimization();
  const taxonomyInsights = await analyzePerformanceTaxonomy(rows);
  const recommendations = await buildOptimizationBundleFromRows(rows, taxonomyInsights);

  const summary =
    taxonomyInsights.topTopics.length > 0
      ? `Top topics this period: ${taxonomyInsights.topTopics.slice(0, 3).join(" · ")}. Use taxonomy mix lines to rebalance under-served pillars.`
      : "Baseline week — capture metrics before tuning taxonomy mix.";

  return {
    weekStart: args.weekStart,
    generatedAt: new Date().toISOString(),
    summary,
    taxonomyInsights,
    recommendations,
    channelNotes: CHANNEL_CONTENT_NOTES,
  };
}
