import { adsAiAutomationFlags, aiAutopilotV1Flags, engineFlags } from "@/config/feature-flags";
import { ADS_AI_AUTOPILOT_ACTIONS } from "@/modules/ads/ads-ai-autopilot-bridge";
import type { ProposedAction } from "../ai-autopilot.types";

/**
 * LECIPM AI Ads Autopilot V1 — recommendation-only; no Meta/Google APIs; no auto-spend.
 * Surfaces as admin `ProposedAction` rows when Growth Machine + AI Autopilot growth domain are on.
 */
export function proposalsAdsAiAutopilot(userId: string): ProposedAction[] {
  void userId;
  if (
    !engineFlags.growthMachineV1 ||
    !aiAutopilotV1Flags.aiAutopilotV1 ||
    !aiAutopilotV1Flags.growthDomain ||
    !adsAiAutomationFlags.aiAdsAutopilotV1
  ) {
    return [];
  }

  const a = ADS_AI_AUTOPILOT_ACTIONS;
  return [
    {
      domain: "growth",
      entityType: "ads_ai_autopilot",
      entityId: "generate_campaign",
      actionType: a.ADS_GENERATE_CAMPAIGN.actionType,
      title: a.ADS_GENERATE_CAMPAIGN.title,
      summary: a.ADS_GENERATE_CAMPAIGN.summary,
      severity: "low",
      riskLevel: "LOW",
      recommendedPayload: {
        module: "modules/ads/ads-campaign-ai.service#generateCampaignStructure",
        mode: "RECOMMENDATION_ONLY",
        safety: "NO_AD_PLATFORM_API_NO_AUTO_SPEND",
      },
      reasons: { confidence: 0.55, rationale: "Structured bundle for manual campaign setup" },
      subjectUserId: null,
      audience: "admin",
    },
    {
      domain: "growth",
      entityType: "ads_ai_autopilot",
      entityId: "optimize_campaign",
      actionType: a.ADS_OPTIMIZE_CAMPAIGN.actionType,
      title: a.ADS_OPTIMIZE_CAMPAIGN.title,
      summary: a.ADS_OPTIMIZE_CAMPAIGN.summary,
      severity: "low",
      riskLevel: "LOW",
      recommendedPayload: {
        module: "modules/ads/ads-ai-optimizer.service#analyzePerformanceAndImprove",
        mode: "RECOMMENDATION_ONLY",
        safety: "NO_AD_PLATFORM_API_NO_AUTO_SPEND",
      },
      reasons: { confidence: 0.52, rationale: "KPI-driven scale / pause / test suggestions" },
      subjectUserId: null,
      audience: "admin",
    },
    {
      domain: "growth",
      entityType: "ads_ai_autopilot",
      entityId: "suggest_creative",
      actionType: a.ADS_SUGGEST_CREATIVE.actionType,
      title: a.ADS_SUGGEST_CREATIVE.title,
      summary: a.ADS_SUGGEST_CREATIVE.summary,
      severity: "low",
      riskLevel: "LOW",
      recommendedPayload: {
        modules: ["modules/ads/ads-creative-ai.service#generateAdCopy", "modules/ads/ads-creative-ai.service#generateVideoScript"],
        mode: "RECOMMENDATION_ONLY",
        safety: "NO_AD_PLATFORM_API_NO_AUTO_SPEND",
      },
      reasons: { confidence: 0.5, rationale: "Copy + video script for manual paste into ad UIs" },
      subjectUserId: null,
      audience: "admin",
    },
  ];
}
