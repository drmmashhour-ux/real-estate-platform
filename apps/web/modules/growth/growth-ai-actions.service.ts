/**
 * Manual-only paid ads suggestions — advisory; never executes spend changes.
 */

import { applyIntelligenceLayer, buildGrowthUnifiedSnapshot } from "./ai-autopilot.service";
import type { AiAutopilotAction } from "./ai-autopilot.types";
import {
  computePaidFunnelAdsInsights,
  fetchEarlyConversionAdsSnapshot,
  type EarlyConversionAdsSnapshot,
} from "./growth-ai-analyzer.service";

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || "x";
}

function baseConfidence(): number {
  return 0.55;
}

type ActionDraft = Omit<AiAutopilotAction, "createdAt" | "priorityScore" | "signalStrength">;

/**
 * Observation rows + concrete manual campaign actions from UTM snapshot.
 */
export async function buildPaidFunnelAutopilotActions(): Promise<AiAutopilotAction[]> {
  const snap = await fetchEarlyConversionAdsSnapshot();
  const { problems, opportunities } = computePaidFunnelAdsInsights(snap);
  const out: ActionDraft[] = [];

  for (const p of problems) {
    out.push({
      id: `ap-ads-problem-${slug(p)}`,
      title: "Campaign underperforming",
      description: `Observation: ${p}. Review creative, audience, and landing alignment before spending more.`,
      source: "ads",
      impact: "medium",
      confidence: baseConfidence(),
      executionMode: "manual_only",
      why: "UTM campaign is underperforming relative to platform volume.",
    });
  }

  for (const o of opportunities) {
    out.push({
      id: `ap-ads-opp-${slug(o)}`,
      title: "Scale winning campaign",
      description: `Opportunity: ${o}. Consider increasing budget on the best-performing UTM after validating lead quality.`,
      source: "ads",
      impact: "high",
      confidence: 0.62,
      executionMode: "manual_only",
      why: "Campaign generating majority of attributed leads — candidate to scale.",
    });
  }

  out.push(...buildManualCampaignActions(snap));

  const snapshot = buildGrowthUnifiedSnapshot();
  const now = new Date().toISOString();
  return out.map((d) => applyIntelligenceLayer({ ...d, createdAt: now }, snapshot));
}

function buildManualCampaignActions(snap: EarlyConversionAdsSnapshot): ActionDraft[] {
  const actions: ActionDraft[] = [];
  const attributed = snap.campaignCounts.filter((c) => c.label !== "(no UTM)");
  if (attributed.length === 0) return actions;

  const top = snap.topCampaign;
  const sortedAsc = [...attributed].sort((a, b) => a.count - b.count);
  const weakest = sortedAsc[0]!;
  const improveTarget =
    attributed.find((c) => c.label !== top?.label) ?? (attributed.length > 1 ? weakest : top);

  if (top) {
    actions.push({
      id: `ap-ads-manual-budget-${slug(top.label)}`,
      title: `Increase budget on campaign ${top.label}`,
      description:
        "Manual-only suggestion: raise daily/lifetime cap in the ad platform after confirming CPL and lead quality.",
      source: "ads",
      impact: "medium",
      confidence: baseConfidence(),
      executionMode: "manual_only",
      why: "Top UTM bucket by volume — validate CPL then consider more budget.",
    });
  }

  if (attributed.length > 1 && weakest.label !== top?.label) {
    actions.push({
      id: `ap-ads-manual-pause-${slug(weakest.label)}`,
      title: `Pause weak campaign ${weakest.label}`,
      description:
        "Manual-only suggestion: pause or tighten targeting for the weakest UTM bucket while you iterate creative.",
      source: "ads",
      impact: "low",
      confidence: 0.48,
      executionMode: "manual_only",
      why: "Weakest UTM bucket — reduce waste before iterating creative.",
    });
  }

  if (improveTarget) {
    actions.push({
      id: `ap-ads-manual-target-${slug(improveTarget.label)}`,
      title: `Improve targeting for campaign ${improveTarget.label}`,
      description:
        "Manual-only suggestion: refine placements, interests, or geo in the ad platform; no auto-changes here.",
      source: "ads",
      impact: "medium",
      confidence: 0.52,
      executionMode: "manual_only",
      why: "Targeting refinement candidate based on UTM mix.",
    });
  }

  return actions;
}
