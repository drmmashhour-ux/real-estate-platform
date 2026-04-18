import { aiAutopilotV1Flags } from "@/config/feature-flags";
import type { ProposedAction } from "../ai-autopilot.types";

/** Hooks into marketing / growth surfaces — SAFE mode: recommendations only (no auto-spend). */
export function proposalsGrowthMarketing(_userId: string): ProposedAction[] {
  if (!aiAutopilotV1Flags.growthDomain) return [];
  const base: ProposedAction[] = [
    {
      domain: "growth",
      entityType: "platform",
      entityId: null,
      actionType: "review_growth_reports",
      title: "Review growth ROI + funnel reports",
      summary:
        "Cross-check `/dashboard/growth/reports` before scaling spend — autopilot never auto-posts or auto-spends.",
      severity: "low",
      riskLevel: "LOW",
      recommendedPayload: { path: "/dashboard/growth/reports" },
      reasons: {
        triggeredBy: "growth domain enabled",
        expectedBenefit: "Align paid + organic with measured funnel steps",
        confidence: 0.55,
      },
      subjectUserId: null,
      audience: "admin",
    },
    {
      domain: "growth",
      entityType: "ads",
      entityId: null,
      actionType: "growth_budget_increase_candidate",
      title: "Candidate: raise budget on best CTR creative (manual)",
      summary:
        "If Meta/Google show one ad set with materially higher CTR at stable CPC, consider a **small** budget nudge — confirm in Ads Manager; LECIPM will not change budgets.",
      severity: "low",
      riskLevel: "LOW",
      recommendedPayload: { mode: "SAFE", autoExecute: false, surface: "ads_manager" },
      reasons: { heuristic: "high_ctr_low_cpa_proxy", confidence: 0.45 },
      subjectUserId: null,
      audience: "admin",
    },
    {
      domain: "growth",
      entityType: "ads",
      entityId: null,
      actionType: "growth_pause_low_conversion",
      title: "Candidate: pause weakest ad set after 3d cooldown (manual)",
      summary:
        "Review ad sets with high spend and zero `lead_capture` in growth reporting — pause or swap creative in the network UI if confirmed.",
      severity: "low",
      riskLevel: "LOW",
      recommendedPayload: { mode: "SAFE", autoExecute: false },
      reasons: { heuristic: "spend_without_leads", confidence: 0.4 },
      subjectUserId: null,
      audience: "admin",
    },
    {
      domain: "growth",
      entityType: "creatives",
      entityId: null,
      actionType: "growth_new_creative_suggestions",
      title: "Rotate creatives: 3 hooks from `buildHighConversionCampaign`",
      summary:
        "Export fresh primary text + headlines from LECIPM ads builders; paste into Meta as new ads inside the same ad set (A/B).",
      severity: "low",
      riskLevel: "LOW",
      recommendedPayload: { module: "modules/ads/facebook-ads-builder.service", mode: "SAFE" },
      reasons: { heuristic: "creative_fatigue_watch", confidence: 0.42 },
      subjectUserId: null,
      audience: "admin",
    },
    {
      domain: "growth",
      entityType: "keywords",
      entityId: null,
      actionType: "growth_keyword_expansion",
      title: "Add exact-match tails from `buildMontrealIntentGoogleAdsStructure`",
      summary:
        "Duplicate best-performing phrase queries into exact match in a controlled ad group — edit in Google Ads UI only.",
      severity: "low",
      riskLevel: "LOW",
      recommendedPayload: { module: "modules/ads/google-ads-builder.service", mode: "SAFE" },
      reasons: { heuristic: "phrase_to_exact_expansion", confidence: 0.48 },
      subjectUserId: null,
      audience: "admin",
    },
  ];
  void _userId;
  return base;
}
