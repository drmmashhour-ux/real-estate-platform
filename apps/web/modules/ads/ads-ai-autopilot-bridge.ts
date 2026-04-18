/**
 * Recommendation-only autopilot descriptors for AI ads — LOW risk; no API spend.
 */

export const ADS_AI_AUTOPILOT_ACTIONS = {
  ADS_GENERATE_CAMPAIGN: {
    actionType: "ADS_GENERATE_CAMPAIGN",
    domain: "growth",
    riskLevel: "LOW" as const,
    title: "Generate AI campaign bundle",
    summary: "Run `generateCampaignStructure()` — copy + targeting + budget hints for manual Meta/Google setup.",
  },
  ADS_OPTIMIZE_CAMPAIGN: {
    actionType: "ADS_OPTIMIZE_CAMPAIGN",
    domain: "growth",
    riskLevel: "LOW" as const,
    title: "Optimize from KPIs",
    summary: "Run `analyzePerformanceAndImprove` with CTR/CPL/conversion — scale / pause / test recommendations only.",
  },
  ADS_SUGGEST_CREATIVE: {
    actionType: "ADS_SUGGEST_CREATIVE",
    domain: "growth",
    riskLevel: "LOW" as const,
    title: "Suggest fresh creatives",
    summary: "Use `generateAdCopy` / `generateVideoScript` — paste into ad networks manually.",
  },
} as const;

export type AdsAiAutopilotActionKey = keyof typeof ADS_AI_AUTOPILOT_ACTIONS;

export function listAdsAiAutopilotRecommendations(): (typeof ADS_AI_AUTOPILOT_ACTIONS)[AdsAiAutopilotActionKey][] {
  return [
    ADS_AI_AUTOPILOT_ACTIONS.ADS_GENERATE_CAMPAIGN,
    ADS_AI_AUTOPILOT_ACTIONS.ADS_OPTIMIZE_CAMPAIGN,
    ADS_AI_AUTOPILOT_ACTIONS.ADS_SUGGEST_CREATIVE,
  ];
}
