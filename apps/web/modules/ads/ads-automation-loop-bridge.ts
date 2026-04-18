/**
 * Recommendation-only growth actions for the full ads automation loop — LOW risk.
 */

export const ADS_AUTOMATION_LOOP_ACTIONS = {
  ADS_LOOP_REVIEW: {
    actionType: "ADS_LOOP_REVIEW",
    domain: "growth",
    riskLevel: "LOW" as const,
    title: "Review full automation loop",
    summary: "Run `runAdsAutomationLoop()` — winners, weak, variants, test plan; no API or spend.",
  },
  ADS_SCALE_WINNER: {
    actionType: "ADS_SCALE_WINNER",
    domain: "growth",
    riskLevel: "LOW" as const,
    title: "Scale a classified winner",
    summary: "Use `duplicateAndScale` hints from `buildNextAdsTestPlan` — apply manually in Ads Manager.",
  },
  ADS_PAUSE_LOSER: {
    actionType: "ADS_PAUSE_LOSER",
    domain: "growth",
    riskLevel: "LOW" as const,
    title: "Pause weak campaigns",
    summary: "Cross-check `weakCampaigns` with network UI; pause there — LECIPM does not pause ads.",
  },
  ADS_TEST_NEW_VARIANT: {
    actionType: "ADS_TEST_NEW_VARIANT",
    domain: "growth",
    riskLevel: "LOW" as const,
    title: "Launch A/B variant test",
    summary: "Paste `generateVariantsFromWinner` output as new ads — keep budget flat until significance.",
  },
  LANDING_OPTIMIZATION_RECOMMENDED: {
    actionType: "LANDING_OPTIMIZATION_RECOMMENDED",
    domain: "growth",
    riskLevel: "LOW" as const,
    title: "Landing funnel optimization",
    summary: "Apply `analyzeLandingFeedbackLoop` items in CMS/design — no auto-deploy.",
  },
  ADS_GEO_REALLOCATE: {
    actionType: "ADS_GEO_REALLOCATE",
    domain: "growth",
    riskLevel: "LOW" as const,
    title: "Geo-aware creative / budget experiments",
    summary: "When growth_events include geo metadata, test duplication in stronger regions before shifting spend — manual only.",
  },
  ADS_HOLD_LOW_DATA: {
    actionType: "ADS_HOLD_LOW_DATA",
    domain: "growth",
    riskLevel: "LOW" as const,
    title: "Hold for more data",
    summary: "Keep budgets flat until impressions/clicks/attribution reach trustworthy volume — no auto changes.",
  },
} as const;

export type AdsAutomationLoopActionKey = keyof typeof ADS_AUTOMATION_LOOP_ACTIONS;

export function listAdsAutomationLoopRecommendations(): (typeof ADS_AUTOMATION_LOOP_ACTIONS)[AdsAutomationLoopActionKey][] {
  return [
    ADS_AUTOMATION_LOOP_ACTIONS.ADS_LOOP_REVIEW,
    ADS_AUTOMATION_LOOP_ACTIONS.ADS_SCALE_WINNER,
    ADS_AUTOMATION_LOOP_ACTIONS.ADS_PAUSE_LOSER,
    ADS_AUTOMATION_LOOP_ACTIONS.ADS_TEST_NEW_VARIANT,
    ADS_AUTOMATION_LOOP_ACTIONS.LANDING_OPTIMIZATION_RECOMMENDED,
    ADS_AUTOMATION_LOOP_ACTIONS.ADS_GEO_REALLOCATE,
    ADS_AUTOMATION_LOOP_ACTIONS.ADS_HOLD_LOW_DATA,
  ];
}
