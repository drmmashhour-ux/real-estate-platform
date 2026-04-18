/**
 * Top-layer growth orchestrator — fuses marketplace, pricing, forecast, ads, governance hints.
 * Returns up to 3 manual_only actions daily (deterministic ordering for stable UI).
 */

import { applyIntelligenceLayer, buildGrowthUnifiedSnapshot } from "./ai-autopilot.service";
import type { AiAutopilotAction } from "./ai-autopilot.types";
import { getMarketplaceBalance } from "./marketplace-balance.service";
import { getAdvancedRecommendedLeadPriceCad } from "./marketplace-dynamic-pricing-advanced.service";
import { getRevenueForecast30d } from "./forecast.service";
import { getCampaignRoiSummary } from "./ads-campaign-roi.service";
import { getGrowth100kGovernanceHints } from "./growth-100k-governance-hints.service";

export async function build100kGrowthOrchestratorTopActions(max = 3): Promise<AiAutopilotAction[]> {
  const snapshot = buildGrowthUnifiedSnapshot();
  const now = new Date().toISOString();

  const [balance, pricing, forecast, ads, gov] = await Promise.all([
    getMarketplaceBalance(),
    getAdvancedRecommendedLeadPriceCad(),
    getRevenueForecast30d(),
    getCampaignRoiSummary(),
    getGrowth100kGovernanceHints(),
  ]);

  type Draft = Omit<AiAutopilotAction, "priorityScore" | "signalStrength">;
  const drafts: Draft[] = [];

  drafts.push({
    id: `100k-orch-marketplace-${balance.balance}`,
    title: `Marketplace health: ${balance.balance}`,
    description: `${balance.leadsLast7d} leads / ${balance.activeBrokers} brokers (${balance.leadsPerBroker} L/B). ${balance.recommendations[0] ?? ""}`,
    source: "leads",
    impact: balance.balance === "balanced" ? "medium" : "high",
    confidence: 0.62,
    executionMode: "manual_only",
    createdAt: now,
    why: "Fusion signal: supply/demand from CRM + broker counts.",
  });

  drafts.push({
    id: "100k-orch-pricing-advanced",
    title: "Advanced pricing recommendation",
    description: `${pricing.note} Suggested $${pricing.recommendedPriceCad.toFixed(2)} CAD (base $${pricing.baseRecommendedCad.toFixed(2)}).`,
    source: "cro",
    impact: "high",
    confidence: 0.55,
    executionMode: "manual_only",
    createdAt: now,
    why: "Combines conversion + marketplace balance with capped factors.",
  });

  drafts.push({
    id: "100k-orch-forecast-30d",
    title: "30-day revenue trajectory (trend)",
    description: `~${forecast.projectedNext30dCad.toFixed(0)} CAD next 30d at ${forecast.avgDailyCad.toFixed(2)} CAD/day (7d trail). ${forecast.method}`,
    source: "ads",
    impact: "medium",
    confidence: 0.5,
    executionMode: "manual_only",
    createdAt: now,
    why: "Run-rate extrapolation for operator planning only.",
  });

  if (ads.scaleSuggestion) {
    drafts.push({
      id: "100k-orch-ads-scale",
      title: "Scale candidate (UTM)",
      description: ads.scaleSuggestion,
      source: "ads",
      impact: "high",
      confidence: 0.58,
      executionMode: "manual_only",
      createdAt: now,
      why: "Attributed /get-leads funnel — validate quality before spend.",
    });
  }

  if (gov.freezeOrAdjust.length > 0) {
    drafts.push({
      id: "100k-orch-governance",
      title: "Governance: review pricing / quality / churn",
      description: gov.freezeOrAdjust.slice(0, 3).join(" · "),
      source: "cro",
      impact: "high",
      confidence: 0.54,
      executionMode: "manual_only",
      createdAt: now,
      why: "Risk hints — manual approval before freezes or targeting changes.",
    });
  }

  const scored = drafts
    .map((d) => applyIntelligenceLayer(d, snapshot))
    .sort((a, b) => b.priorityScore - a.priorityScore);

  return scored.slice(0, max);
}
