/**
 * Deterministic advisory suggestions for CRO presentation and ads strategy — no execution, no API calls.
 */

import { aiAutopilotInfluenceFlags } from "@/config/feature-flags";
import { computePriorityScore } from "./ai-autopilot.service";
import type { AiInfluenceSuggestion } from "./ai-autopilot-influence.types";
import type { AiAutopilotImpact } from "./ai-autopilot.types";

export type InfluenceSnapshot = {
  conversionRateViewToLeadPercent: number | null;
  funnelSteps: {
    landing_view: number;
    cta_click: number;
    listing_view: number;
    lead_capture: number;
  };
  leadsFromPublicLanding: number;
  campaignsCount: number;
  clicks90d: number;
  impressions90d: number;
};

function iso(now?: string): string {
  return now ?? new Date().toISOString();
}

function finalize(
  partial: Omit<AiInfluenceSuggestion, "priorityScore" | "createdAt"> & { createdAt?: string },
): AiInfluenceSuggestion {
  const impact = partial.impact as AiAutopilotImpact;
  const priorityScore = computePriorityScore(impact, partial.confidence, "medium");
  return {
    ...partial,
    priorityScore,
    createdAt: partial.createdAt ?? iso(),
  };
}

/**
 * Build prioritized influence suggestions (top 3 by priorityScore: impact + confidence via shared blend).
 */
export function buildInfluenceSuggestions(snapshot: InfluenceSnapshot, opts?: { now?: string }): AiInfluenceSuggestion[] {
  if (!aiAutopilotInfluenceFlags.influenceV1) {
    return [];
  }

  const createdAt = iso(opts?.now);
  const lv = Math.max(0, snapshot.funnelSteps.landing_view);
  const cta = Math.max(0, snapshot.funnelSteps.cta_click);
  const cap = Math.max(0, snapshot.funnelSteps.lead_capture);
  const conv = snapshot.conversionRateViewToLeadPercent;
  const ctaRate = lv > 0 ? cta / lv : 0;
  const leadPerCta = cta > 0 ? cap / cta : 0;

  const pool: AiInfluenceSuggestion[] = [];

  if (lv >= 20 && conv != null && conv < 2) {
    pool.push(
      finalize({
        id: "inf-cro-headline-1",
        target: "cro_ui",
        title: "Clarify the hero headline",
        description:
          "Landing views are present but view→lead conversion is under 2%. Test a clearer value headline that states who it’s for and the next step.",
        impact: "high",
        confidence: 0.62,
        reason: "Low conversion with meaningful traffic",
        createdAt,
      }),
    );
  }

  if (lv >= 10 && ctaRate < 0.03) {
    pool.push(
      finalize({
        id: "inf-cro-cta-1",
        target: "cro_ui",
        title: "Reposition the primary CTA",
        description:
          "CTA clicks are weak relative to views. Move the primary CTA above the fold and align its label with the hero promise.",
        impact: "high",
        confidence: 0.58,
        reason: "High drop-off between view and CTA click",
        createdAt,
      }),
    );
  }

  if (cta >= 5 && leadPerCta < 0.2) {
    pool.push(
      finalize({
        id: "inf-cro-form-1",
        target: "cro_ui",
        title: "Shorten the capture form",
        description:
          "Leads lag behind CTA clicks. Consider fewer required fields or a two-step flow to reduce friction.",
        impact: "medium",
        confidence: 0.55,
        reason: "Low lead capture vs CTA engagement",
        createdAt,
      }),
    );
  }

  if (snapshot.campaignsCount === 0 && snapshot.impressions90d < 500) {
    pool.push(
      finalize({
        id: "inf-ads-start-1",
        target: "ads_strategy",
        title: "Plan a first structured campaign",
        description:
          "No active campaigns detected with limited recent reach. Draft one focused campaign with a clear audience and landing destination before spending.",
        impact: "medium",
        confidence: 0.52,
        reason: "No campaigns and low impressions",
        createdAt,
      }),
    );
  }

  if (snapshot.campaignsCount > 0 && snapshot.clicks90d > 40 && snapshot.leadsFromPublicLanding < 3) {
    pool.push(
      finalize({
        id: "inf-ads-test-1",
        target: "ads_strategy",
        title: "Test or pause underperforming traffic",
        description:
          "Clicks exist but few landing leads. Review creative and targeting; run a small A/B on copy or audience (manual export only — no auto-deploy).",
        impact: "high",
        confidence: 0.6,
        reason: "Low leads despite click volume",
        createdAt,
      }),
    );
  }

  if (snapshot.leadsFromPublicLanding >= 5 && conv != null && conv >= 3) {
    pool.push(
      finalize({
        id: "inf-ads-scale-1",
        target: "ads_strategy",
        title: "Consider cautious scale on what works",
        description:
          "Funnel is producing leads at a healthy view→lead rate. If unit economics allow, increase budget gradually on the same creative set.",
        impact: "medium",
        confidence: 0.54,
        reason: "Strong conversion and lead flow",
        createdAt,
      }),
    );
  }

  if (pool.length === 0) {
    pool.push(
      finalize({
        id: "inf-default-observe",
        target: "cro_ui",
        title: "Collect a bit more signal",
        description:
          "Not enough differentiated funnel signal yet for targeted CRO/ads tweaks. Keep tracking events and revisit when volume grows.",
        impact: "low",
        confidence: 0.45,
        reason: "Insufficient contrast in snapshot metrics",
        createdAt,
      }),
    );
  }

  const sorted = [...pool].sort((a, b) => b.priorityScore - a.priorityScore);
  return sorted.slice(0, 3);
}
