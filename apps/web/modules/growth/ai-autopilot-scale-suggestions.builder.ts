/**
 * $10K scale layer — manual_only advisory rows; never executes spend or pricing changes.
 */

import { applyIntelligenceLayer, buildGrowthUnifiedSnapshot } from "./ai-autopilot.service";
import type { AiAutopilotAction } from "./ai-autopilot.types";
import { getBrokerRetentionSuggestions } from "./broker-retention.service";
import { getCampaignRoiSummary } from "./ads-campaign-roi.service";
import { getRecommendedLeadPriceCad } from "@/modules/revenue/pricing-optimizer.service";

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "x";
}

export async function buildScaleAutopilotManualSuggestions(): Promise<AiAutopilotAction[]> {
  const snapshot = buildGrowthUnifiedSnapshot();
  const now = new Date().toISOString();
  const out: Omit<AiAutopilotAction, "priorityScore" | "signalStrength">[] = [];

  const [retention, pricing, ads] = await Promise.all([
    getBrokerRetentionSuggestions(6),
    getRecommendedLeadPriceCad(),
    getCampaignRoiSummary(),
  ]);

  for (const r of retention) {
    out.push({
      id: `scale-retention-${r.kind}-${slug(r.userId)}`,
      title: r.title,
      description: r.detail,
      source: "leads",
      impact: r.kind === "vip_priority" ? "high" : "medium",
      confidence: 0.58,
      executionMode: "manual_only",
      createdAt: now,
      why: "Scale retention rule — operator executes outreach; no auto messaging.",
    });
  }

  out.push({
    id: `scale-pricing-${pricing.adjustmentPercent}`,
    title: "Review default lead unlock price",
    description: `${pricing.note} Suggested anchor: $${pricing.recommendedPrice.toFixed(2)} CAD (current config anchor $${pricing.anchorCad}). Recent unlocks: ${pricing.recentUnlocks} (7d) vs ${pricing.priorUnlocks} (prior 7d).`,
    source: "cro",
    impact: "medium",
    confidence: 0.52,
    executionMode: "manual_only",
    createdAt: now,
    why: "Pricing optimizer — bounded nudge only; confirm in admin + Stripe catalog before any change.",
  });

  if (ads.scaleSuggestion) {
    out.push({
      id: `scale-ads-scale-${slug(ads.scaleSuggestion)}`,
      title: "Scale winning UTM campaign (manual)",
      description: `${ads.scaleSuggestion} Validate lead quality before increasing paid spend.`,
      source: "ads",
      impact: "high",
      confidence: 0.6,
      executionMode: "manual_only",
      createdAt: now,
      why: "UTM snapshot indicates concentration — still operator-controlled budget.",
    });
  }

  if (ads.pauseSuggestion && ads.health !== "STRONG") {
    out.push({
      id: `scale-ads-pause-${slug(ads.pauseSuggestion)}`,
      title: "Tighten or pause weak UTM",
      description: ads.pauseSuggestion,
      source: "ads",
      impact: "medium",
      confidence: 0.55,
      executionMode: "manual_only",
      createdAt: now,
      why: "Protect ROI — reduce waste before scaling winners.",
    });
  }

  return out.map((a) => applyIntelligenceLayer(a, snapshot));
}
