import {
  getFullGrowthAnalysis,
  type FullGrowthAnalysis,
  type GrowthFunnelEventsInput,
} from "@/modules/ads/ads-performance.service";
import type { CampaignAdsMetrics } from "@/modules/ads/ads-performance.service";
import { logInfo } from "@/lib/logger";
import { decideScaling } from "./scaling-engine.service";

export type AutoOptimizerCampaignInput = {
  id: string;
  metrics: CampaignAdsMetrics;
};

export type AutoOptimizerResult = {
  timestamp: string;
  analysis: FullGrowthAnalysis;
  campaignDecisions: { id: string; decision: ReturnType<typeof decideScaling> }[];
};

/**
 * Batch diagnostic for cron / internal calls — does not mutate spend or campaigns.
 * Pass the same funnel counts used for ads reporting + per-UTM campaign rows.
 */
export function runAutoOptimizer(data: {
  events: GrowthFunnelEventsInput;
  campaigns: AutoOptimizerCampaignInput[];
  /** When provided (e.g. dashboard), avoids recomputing funnel metrics. */
  analysis?: FullGrowthAnalysis;
}): AutoOptimizerResult {
  const analysis = data.analysis ?? getFullGrowthAnalysis(data.events);
  const healthScore = analysis.healthScore;

  const campaignDecisions = data.campaigns.map((c) => {
    const ctrRatio = (c.metrics.ctrPercent ?? 0) / 100;
    const convRatio = (c.metrics.conversionRatePercent ?? 0) / 100;
    const decision = decideScaling(
      {
        ctr: ctrRatio,
        conversionRate: convRatio,
        cpl: c.metrics.cpl,
        clicks: c.metrics.clicks,
      },
      { healthScore, quiet: true },
    );
    logInfo("[auto-optimizer] campaign decision", {
      campaignId: c.id,
      action: decision.action,
      healthScore,
    });
    return { id: c.id, decision };
  });

  logInfo("[auto-optimizer] run complete", {
    healthScore,
    leakCount: analysis.leaks.length,
    campaigns: campaignDecisions.length,
  });

  return {
    timestamp: new Date().toISOString(),
    analysis,
    campaignDecisions,
  };
}
