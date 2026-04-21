/**
 * Marketplace optimizer — proposes actions from flywheel metrics + thresholds.
 * Never performs destructive changes automatically; operators review before execution.
 */

import { metricsLog } from "@/lib/metrics-log";
import type { MarketplaceFlywheelInsightType } from "@/modules/marketplace/flywheel.types";
import {
  analyzeMarketplaceGrowth,
  collectFlywheelMarketplaceMetrics,
} from "@/modules/marketplace/flywheel.service";

export type MarketplaceOptimizationAction = {
  action:
    | "boost_listing"
    | "suggest_price_review"
    | "highlight_broker_enablement"
    | "reduce_low_performer_exposure"
    | "conversion_playbook";
  reason: string;
  severity: "low" | "medium" | "high";
  requiresReview: true;
  metrics?: Record<string, number>;
};

const TH = {
  winRateFloor: 0.08,
  unlockFloor: 0.12,
  hotShareBoost: 0.35,
  brokerLoadHigh: 45,
};

export async function proposeMarketplaceOptimizationActions(): Promise<MarketplaceOptimizationAction[]> {
  const metrics = await collectFlywheelMarketplaceMetrics();
  const insights = await analyzeMarketplaceGrowth();

  const out: MarketplaceOptimizationAction[] = [];

  const baseMetricPayload = {
    unlockRate: Number(metrics.unlockRate.toFixed(4)),
    winRate: Number(metrics.winRate.toFixed(4)),
    hotShare: Number(metrics.hotShare.toFixed(4)),
    leadsPerBroker: Number(metrics.leadsPerBroker.toFixed(2)),
  };

  if (metrics.winRate < TH.winRateFloor && metrics.leadCount30 >= 40) {
    out.push({
      action: "conversion_playbook",
      reason:
        "Win rate vs lead volume suggests reviewing qualification + follow-up SLAs before buying more traffic.",
      severity: "high",
      requiresReview: true,
      metrics: baseMetricPayload,
    });
  }

  if (metrics.unlockRate > 0 && metrics.unlockRate < TH.unlockFloor && metrics.leadCount30 >= 30) {
    out.push({
      action: "suggest_price_review",
      reason:
        "Unlock rate is materially below typical ranges — inspect pricing/unlock UX on high-intent cohorts (manual review).",
      severity: "medium",
      requiresReview: true,
      metrics: baseMetricPayload,
    });
  }

  if (metrics.hotShare >= TH.hotShareBoost && metrics.activeListings > 0) {
    out.push({
      action: "boost_listing",
      reason:
        "High share of hot leads — candidate for curated boosts / spotlight placements after policy review.",
      severity: "medium",
      requiresReview: true,
      metrics: baseMetricPayload,
    });
  }

  if (metrics.leadsPerBroker > TH.brokerLoadHigh) {
    out.push({
      action: "highlight_broker_enablement",
      reason:
        "Leads-per-broker elevated — prioritize tooling/training surfaces before adding net-new demand.",
      severity: "low",
      requiresReview: true,
      metrics: baseMetricPayload,
    });
  }

  if (metrics.winRate < TH.winRateFloor / 2 && metrics.leadCount30 >= 60) {
    out.push({
      action: "reduce_low_performer_exposure",
      reason:
        "Very low realized win rate at meaningful volume — audit cohort quality before expanding acquisition (policy-gated).",
      severity: "high",
      requiresReview: true,
      metrics: baseMetricPayload,
    });
  }

  for (const insight of insights.slice(0, 4)) {
    out.push({
      action: mapInsightToAction(insight.type),
      reason: `${insight.title}: ${insight.description}`,
      severity: insight.impact === "high" ? "high" : insight.impact === "medium" ? "medium" : "low",
      requiresReview: true,
      metrics: baseMetricPayload,
    });
  }

  const dedup = new Map<string, MarketplaceOptimizationAction>();
  for (const item of out) {
    dedup.set(`${item.action}:${item.reason.slice(0, 120)}`, item);
  }

  const list = Array.from(dedup.values());
  metricsLog.growth("marketplace_optimizer_proposals", {
    proposalCount: list.length,
    winRate: metrics.winRate,
    unlockRate: metrics.unlockRate,
  });

  return list;
}

function mapInsightToAction(type: MarketplaceFlywheelInsightType): MarketplaceOptimizationAction["action"] {
  switch (type) {
    case "pricing_opportunity":
      return "suggest_price_review";
    case "broker_gap":
      return "highlight_broker_enablement";
    case "conversion_opportunity":
      return "conversion_playbook";
    case "demand_gap":
      return "conversion_playbook";
    case "supply_gap":
      return "boost_listing";
    default:
      return "conversion_playbook";
  }
}
