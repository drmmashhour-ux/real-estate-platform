import { getManualSpendAggregatedForAdsWindow } from "@/modules/ads/growth-ops-manual-spend.service";
import {
  detectWinningCampaigns,
  getAdsPerformanceByCampaign,
  getAdsPerformanceSummary,
} from "@/modules/ads/ads-performance.service";
import { generateScalingRecommendations } from "@/modules/ads/ads-scaling-recommendations.service";
import { portfolioOptimizationFlags } from "@/config/feature-flags";
import { buildPortfolioOptimizationSummary } from "@/modules/growth/portfolio-optimization.service";
import {
  buildCampaignProfitMetrics,
  buildPortfolioInputsFromCampaignMetrics,
  generateProfitRecommendations,
} from "@/modules/growth/profit-engine.service";
import { buildUnifiedSnapshot } from "@/modules/growth/unified-learning.service";
import { proposalsRetargetingAutopilot } from "@/modules/ai-autopilot/actions/retargeting.autopilot.adapter";
import { proposalsAbTestingAutopilot } from "@/modules/ai-autopilot/actions/ab-testing.autopilot.adapter";
import { getRecentMarketplaceDecisions } from "@/modules/marketplace-intelligence/marketplace-intelligence.repository";
import type { AssistantRecommendation } from "./operator.types";
import {
  mapAbDecisions,
  mapAdsRecommendations,
  mapCroRecommendations,
  mapMarketplaceDecisions,
  mapPortfolioBudgetReallocations,
  mapProfitRecommendations,
  mapRetargetingRecommendations,
  mapUnifiedLearningNudge,
} from "./recommendation-mappers.service";

const RANGE_DAYS = 14;

function campaignMetricsByKey(
  campaigns: Awaited<ReturnType<typeof getAdsPerformanceByCampaign>>,
): Record<string, { estimatedSpend: number; cpl: number | null }> {
  return Object.fromEntries(
    campaigns.map((c) => [c.campaignKey, { estimatedSpend: c.estimatedSpend, cpl: c.cpl }]),
  );
}

/**
 * Latest ads scaling suggestions (same inputs as growth dashboard ads performance section).
 */
export async function getLatestAdsOperatorRecommendations(): Promise<AssistantRecommendation[]> {
  try {
    const [spendCurrent] = await Promise.all([getManualSpendAggregatedForAdsWindow(RANGE_DAYS, 0)]);
    const [summary, campaigns] = await Promise.all([
      getAdsPerformanceSummary(RANGE_DAYS, { estimatedSpend: spendCurrent.totalDollars }),
      getAdsPerformanceByCampaign(RANGE_DAYS, { estimatedSpendByCampaign: spendCurrent.byCampaign }),
    ]);
    const { winners, losers } = detectWinningCampaigns(campaigns);
    const profitMetrics = await buildCampaignProfitMetrics(campaigns);
    const profitByCampaign = Object.fromEntries(profitMetrics.map((m) => [m.campaignId, m]));
    const scaling = generateScalingRecommendations(winners, losers, {
      stableWinnerKeys: winners.filter((w) => (w.ctrPercent ?? 0) >= 2).map((w) => w.campaignKey),
      profitByCampaign,
    });
    const byKey = campaignMetricsByKey(campaigns);
    const mapped = mapAdsRecommendations(scaling);
    return mapped.map((r) => {
      const key = (r.metrics?.campaignKey as string | undefined) ?? r.targetId ?? undefined;
      const m = key ? byKey[key] : undefined;
      return {
        ...r,
        metrics: {
          ...r.metrics,
          estimatedSpend: m?.estimatedSpend ?? summary.estimatedSpend,
          cpl: m?.cpl ?? summary.cpl,
        },
      };
    });
  } catch {
    return [];
  }
}

export async function getLatestProfitRecommendations(): Promise<AssistantRecommendation[]> {
  try {
    const [spendCurrent] = await Promise.all([getManualSpendAggregatedForAdsWindow(RANGE_DAYS, 0)]);
    const campaigns = await getAdsPerformanceByCampaign(RANGE_DAYS, {
      estimatedSpendByCampaign: spendCurrent.byCampaign,
    });
    const profitMetrics = await buildCampaignProfitMetrics(campaigns);
    const conversionRates = Object.fromEntries(
      campaigns.map((c) => [c.campaignKey, (c.conversionRatePercent ?? 0) / 100]),
    );
    const rows = generateProfitRecommendations(profitMetrics, conversionRates);
    return mapProfitRecommendations(rows);
  } catch {
    return [];
  }
}

export async function getLatestPortfolioRecommendations(): Promise<AssistantRecommendation[]> {
  try {
    if (!portfolioOptimizationFlags.portfolioOptimizationV1) return [];
    const [spendCurrent] = await Promise.all([getManualSpendAggregatedForAdsWindow(RANGE_DAYS, 0)]);
    const campaigns = await getAdsPerformanceByCampaign(RANGE_DAYS, {
      estimatedSpendByCampaign: spendCurrent.byCampaign,
    });
    const profitMetrics = await buildCampaignProfitMetrics(campaigns);
    const inputs = buildPortfolioInputsFromCampaignMetrics(campaigns, profitMetrics);
    const summary = buildPortfolioOptimizationSummary(inputs);
    return mapPortfolioBudgetReallocations(summary.recommendations);
  } catch {
    return [];
  }
}

export async function getLatestCroRecommendations(): Promise<AssistantRecommendation[]> {
  try {
    const snap = buildUnifiedSnapshot();
    return mapCroRecommendations({
      preferredPrimaryCta: snap.preferredPrimaryCta,
      weakCtAs: snap.weakCtas,
    });
  } catch {
    return [];
  }
}

export async function getLatestRetargetingRecommendations(): Promise<AssistantRecommendation[]> {
  try {
    const actions = proposalsRetargetingAutopilot("operator-layer");
    return mapRetargetingRecommendations(actions);
  } catch {
    return [];
  }
}

export async function getLatestAbRecommendations(): Promise<AssistantRecommendation[]> {
  try {
    const actions = proposalsAbTestingAutopilot("operator-layer");
    const mapped = mapAbDecisions(actions);
    return mapped.map((r) => {
      const at = String(r.metrics?.actionType ?? "");
      let experimentAssignments = 0;
      if (at.includes("promote") || at.includes("winner")) experimentAssignments = 120;
      else if (at.includes("review")) experimentAssignments = 80;
      else experimentAssignments = 400;
      return {
        ...r,
        metrics: { ...r.metrics, experimentAssignments },
      };
    });
  } catch {
    return [];
  }
}

export async function getLatestMarketplaceRecommendations(): Promise<AssistantRecommendation[]> {
  try {
    const rows = await getRecentMarketplaceDecisions(40);
    return mapMarketplaceDecisions(
      rows.map((row) => ({
        id: row.id,
        listingId: row.listingId,
        decisionType: row.decisionType,
        reason: row.reason,
        confidence: row.confidence,
        priority: row.priority,
      })),
    );
  } catch {
    return [];
  }
}

export async function getLatestUnifiedMonitoringCard(): Promise<AssistantRecommendation[]> {
  try {
    const snap = buildUnifiedSnapshot();
    return mapUnifiedLearningNudge({ evidenceQualityHint: snap.evidenceQualityHint });
  } catch {
    return [];
  }
}
