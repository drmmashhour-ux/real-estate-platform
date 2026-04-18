import { adsStrategyFlags, aiAutopilotV1Flags } from "@/config/feature-flags";
import type { ProposedAction } from "../ai-autopilot.types";

/**
 * Recommendation-only ads strategy layer — no API calls, no budget changes.
 * Requires growth autopilot domain + ads strategy flag.
 */
export function proposalsAdsStrategyRecommendations(_userId: string): ProposedAction[] {
  if (!adsStrategyFlags.adsStrategyV1 || !aiAutopilotV1Flags.growthDomain) return [];

  return [
    {
      domain: "growth",
      entityType: "ads_strategy",
      entityId: "launch_plan",
      actionType: "ads_strategy_review_launch",
      title: "Review `buildLaunchAdsStrategy()` before increasing spend",
      summary:
        "Confirm channel priority (Search → Meta → groups) matches your inventory constraints. Export packs from `listFacebookCampaignPacks` / `listGoogleCampaignPacks` — paste manually.",
      severity: "low",
      riskLevel: "LOW",
      recommendedPayload: {
        modules: [
          "modules/ads/ads-strategy.service",
          "modules/ads/facebook-campaign-packs.service",
          "modules/ads/google-campaign-packs.service",
        ],
        mode: "RECOMMENDATION_ONLY",
      },
      reasons: { confidence: 0.52, rationale: "Structured launch reduces wasted learning budget" },
      subjectUserId: null,
      audience: "admin",
    },
    {
      domain: "growth",
      entityType: "ads_strategy",
      entityId: "scale_rules",
      actionType: "ads_strategy_apply_scale_rules",
      title: "Apply `buildScalePlan()` stop/scale rules in Ads Manager",
      summary:
        "If CPL exceeds threshold or CTR collapses vs baseline, pause losers before duplicating winners — autopilot will not pause ads for you.",
      severity: "low",
      riskLevel: "LOW",
      recommendedPayload: { module: "modules/ads/ads-strategy.service#buildScalePlan", mode: "RECOMMENDATION_ONLY" },
      reasons: { confidence: 0.5, rationale: "Guardrails for 1k-user scale path" },
      subjectUserId: null,
      audience: "admin",
    },
    {
      domain: "growth",
      entityType: "creatives",
      entityId: "headline_test",
      actionType: "ads_strategy_rewrite_headline",
      title: "Test alternate headline from `buildLandingOptimizationPack`",
      summary:
        "Pick `headlineAlt` for BNHub/host/buy landings as a new ad variant — measure landing_view → lead_capture delta.",
      severity: "low",
      riskLevel: "LOW",
      recommendedPayload: { module: "modules/ads/landing-optimization-pack.service", mode: "RECOMMENDATION_ONLY" },
      reasons: { confidence: 0.44 },
      subjectUserId: null,
      audience: "admin",
    },
    {
      domain: "growth",
      entityType: "audience",
      entityId: "meta_audience",
      actionType: "ads_strategy_test_audience",
      title: "Split audience: interests vs broad (Meta)",
      summary:
        "Duplicate ad set with broader Advantage+ audience only after baseline CPL stable 7+ days — see `buildMetaAdsManagerGuide`.",
      severity: "low",
      riskLevel: "MEDIUM",
      recommendedPayload: { module: "modules/ads/ads-manager-guide.service#buildMetaAdsManagerGuide", mode: "RECOMMENDATION_ONLY" },
      reasons: { confidence: 0.41 },
      subjectUserId: null,
      audience: "admin",
    },
    {
      domain: "growth",
      entityType: "first_100",
      entityId: "operating_plan",
      actionType: "ads_strategy_first_100_playbook",
      title: "Run `buildFirst100UsersOperatingPlan()` outreach cadence",
      summary:
        "Use DM/email scripts as templates; customize per recipient — no automated sends from LECIPM.",
      severity: "low",
      riskLevel: "LOW",
      recommendedPayload: { module: "modules/launch/first-100-users-plan.service", mode: "RECOMMENDATION_ONLY" },
      reasons: { confidence: 0.48 },
      subjectUserId: null,
      audience: "admin",
    },
  ];
}
