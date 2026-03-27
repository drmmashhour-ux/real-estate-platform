import { computeContentPerformanceScore } from "@/src/modules/growth-automation/analytics/computeContentPerformanceScore";
import {
  analyzePerformanceTaxonomy,
  type PerformanceRowWithItem,
  type TaxonomyPerformanceInsights,
} from "@/src/modules/growth-automation/analytics/performanceTaxonomyAnalysis";
import { optimizeHooks } from "@/src/modules/growth-automation/analytics/optimizeHooks";
import { optimizePostingTimes } from "@/src/modules/growth-automation/analytics/optimizePostingTimes";
import { optimizeTopicMix } from "@/src/modules/growth-automation/analytics/optimizeTopicMix";
import { CONTENT_PILLARS } from "@/src/modules/growth-automation/domain/contentTaxonomy";
import type { OptimizationBundle } from "@/src/modules/growth-automation/domain/growth-automation.types";
import { listPerformanceForOptimization } from "@/src/modules/growth-automation/infrastructure/growthAutomationRepository";

function taxonomyMixSuggestions(
  pillarLift: Partial<Record<string, number>>,
): string[] {
  const pairs = CONTENT_PILLARS.map((p) => ({ p, score: pillarLift[p] ?? 0 }));
  const avg = pairs.reduce((a, b) => a + b.score, 0) / pairs.length || 1;
  const under = pairs.filter((x) => x.score < avg * 0.85).map((x) => x.p);
  const over = pairs.filter((x) => x.score > avg * 1.15).map((x) => x.p);
  const out: string[] = [];
  if (under.length) out.push(`Increase scheduled share: ${under.join(", ")}`);
  if (over.length) out.push(`Maintain but avoid over-indexing: ${over.join(", ")}`);
  if (!out.length) out.push("Keep balanced rotation across all five pillars.");
  return out;
}

export async function buildOptimizationBundleFromRows(
  rows: PerformanceRowWithItem[],
  taxonomyInsights: TaxonomyPerformanceInsights,
): Promise<OptimizationBundle> {
  const scored = rows.map((r) => {
    const s = computeContentPerformanceScore({
      views: r.views,
      clicks: r.clicks ?? 0,
      likes: r.likes,
      comments: r.comments,
      shares: r.shares,
      conversions: r.conversions,
    });
    return { ...r, score: s };
  });
  const hooks = optimizeHooks(scored);
  const postingTimesHint = optimizePostingTimes(scored);
  const topicMix = optimizeTopicMix(scored);
  const top = scored.sort((a, b) => b.score - a.score)[0];

  return {
    hooks,
    postingTimesHint,
    topicMix,
    ctas: top
      ? [`Double down on topics like “${top.contentItem.topic.slice(0, 48)}…”`]
      : ["Collect 2 weeks of metrics before tuning CTAs."],
    taxonomyMix: taxonomyMixSuggestions(taxonomyInsights.pillarLift),
    topHooks: taxonomyInsights.topHooks.slice(0, 10),
    topPlatforms: taxonomyInsights.topPlatforms.slice(0, 6).map((x) => x.platform),
    topTopics: taxonomyInsights.topTopics,
  };
}

export async function generateOptimizationRecommendations(): Promise<OptimizationBundle> {
  const rows = await listPerformanceForOptimization();
  const taxonomyInsights = await analyzePerformanceTaxonomy(rows);
  return buildOptimizationBundleFromRows(rows, taxonomyInsights);
}
