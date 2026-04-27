import type { AdPlatform } from "./campaignEnginePure";

export type CampaignOptimizationRecommendation = "scale_budget" | "pause_campaign" | "improve_copy" | "keep_running";

export function computeOptimizationRecommendation(
  input: {
    impressions: number;
    clicks: number;
    conversions: number;
    spend: number;
    ctr: number;
    conversionRate: number;
    costPerConversion: number | null;
  } | null
): {
  recommendation: CampaignOptimizationRecommendation;
  suggestedAction: string;
  reason: string;
} {
  if (!input || input.impressions <= 0) {
    return {
      recommendation: "keep_running",
      suggestedAction: "Run a campaign simulation to collect performance, then re-check optimization.",
      reason: "No performance data yet (or zero impressions).",
    };
  }

  const { clicks, conversions, spend, ctr, costPerConversion } = input;

  if (conversions >= 10 && costPerConversion != null && costPerConversion <= 20) {
    return {
      recommendation: "scale_budget",
      suggestedAction: "In a real campaign, plan a higher daily budget in the ad platform. Here we only log a scale recommendation (simulation only).",
      reason: "Strong volume (10+ conversions) with efficient cost per conversion (≤ $20).",
    };
  }

  if (spend >= 100 && conversions === 0) {
    return {
      recommendation: "pause_campaign",
      suggestedAction: "Mark this campaign as completed in the simulator to reflect a strategic pause, or re-run with revised copy and targeting after review.",
      reason: "Spend reached $100 with zero conversions — risk of wasted spend if left unchanged.",
    };
  }

  if (ctr < 0.015) {
    return {
      recommendation: "improve_copy",
      suggestedAction: "Test stronger headlines, clearer value, and a clearer CTA. Use the suggested copy refresh below (simulation only, no ad platform changes).",
      reason: "CTR is below 1.5% — copy or creative relevance is likely the bottleneck.",
    };
  }

  return {
    recommendation: "keep_running",
    suggestedAction: "Keep the current line and re-evaluate after the next performance snapshot.",
    reason: "Metrics are in a safe band for continued testing.",
  };
}

export function platformAsAdPlatform(platform: string): AdPlatform {
  const p = platform.toLowerCase();
  if (p === "tiktok" || p === "meta" || p === "google") return p;
  return "meta";
}
