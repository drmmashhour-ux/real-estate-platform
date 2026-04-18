/**
 * $1M global strategic layer — top manual_only actions; never auto-executes money movement.
 */

import { applyIntelligenceLayer, buildGrowthUnifiedSnapshot } from "./ai-autopilot.service";
import type { AiAutopilotAction } from "./ai-autopilot.types";
import { getMarketExpansionSnapshot } from "./market-expansion.service";
import { getFinanceControlSnapshot } from "./finance-control.service";
import { getAcquisitionScaleSnapshot } from "./acquisition-scale.service";
import { getRiskManagement1mSnapshot } from "./risk-management-1m.service";
import { getAdvancedRecommendedLeadPriceCad } from "./marketplace-dynamic-pricing-advanced.service";

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 36) || "x";
}

export async function build1mGlobalStrategicActions(max = 5): Promise<AiAutopilotAction[]> {
  const snapshot = buildGrowthUnifiedSnapshot();
  const now = new Date().toISOString();

  const [expansion, finance, acquisition, risk, pricing] = await Promise.all([
    getMarketExpansionSnapshot(),
    getFinanceControlSnapshot(),
    getAcquisitionScaleSnapshot(),
    getRiskManagement1mSnapshot(),
    getAdvancedRecommendedLeadPriceCad(),
  ]);

  type Draft = Omit<AiAutopilotAction, "priorityScore" | "signalStrength">;
  const drafts: Draft[] = [];

  const topMarket = expansion.markets[0];
  if (topMarket) {
    drafts.push({
      id: `1m-market-${slug(topMarket.marketKey)}`,
      title: `Prioritize market: ${topMarket.marketKey}`,
      description: `~${topMarket.revenueCad30dEstimated.toFixed(0)} CAD estimated (30d) · ${topMarket.leads30d} leads. Underperforming: ${expansion.underperforming.slice(0, 3).join(", ") || "—"}.`,
      source: "leads",
      impact: "high",
      confidence: 0.58,
      executionMode: "manual_only",
      createdAt: now,
      why: "Multi-market expansion engine — resource allocation is manual.",
    });
  }

  drafts.push({
    id: "1m-finance-control",
    title: "Financial control checkpoint",
    description:
      finance.profitCad30dEstimated != null
        ? `30d revenue ${finance.revenueCad30d.toFixed(0)} CAD vs est. cost ${finance.estimatedCostCad30d?.toFixed(0) ?? "—"} · margin ${finance.marginPercent?.toFixed(1) ?? "—"}%.`
        : `${finance.note} Revenue (30d): ${finance.revenueCad30d.toFixed(0)} CAD.`,
    source: "cro",
    impact: "high",
    confidence: 0.52,
    executionMode: "manual_only",
    createdAt: now,
    why: "Profitability guardrail — configure ops cost env for full picture.",
  });

  drafts.push({
    id: "1m-acquisition-scale",
    title: "Acquisition at scale",
    description: `${acquisition.note} Referral events (30d): ${acquisition.referralEvents30d}. Blended CAC: ${acquisition.blendedCacCad?.toFixed(2) ?? "N/A"} CAD.`,
    source: "ads",
    impact: "high",
    confidence: 0.55,
    executionMode: "manual_only",
    createdAt: now,
    why: "Channel ROI + referrals — increase spend only after quality checks.",
  });

  if (risk.recommendations.length > 0) {
    drafts.push({
      id: "1m-risk-governance",
      title: "Risk & governance review",
      description: risk.recommendations.slice(0, 4).join(" · "),
      source: "cro",
      impact: "high",
      confidence: 0.54,
      executionMode: "manual_only",
      createdAt: now,
      why: "Fraud/velocity/imbalance hints — restrictions require human approval.",
    });
  }

  drafts.push({
    id: "1m-global-pricing",
    title: "Global pricing alignment",
    description: `Advanced anchor $${pricing.recommendedPriceCad.toFixed(2)} CAD · balance ${pricing.balance} · ${pricing.note}`,
    source: "cro",
    impact: "medium",
    confidence: 0.5,
    executionMode: "manual_only",
    createdAt: now,
    why: "Region rollout must stay manual until localized checkout is certified.",
  });

  const scored = drafts
    .map((d) => applyIntelligenceLayer(d, snapshot))
    .sort((a, b) => b.priorityScore - a.priorityScore);

  return scored.slice(0, max);
}
