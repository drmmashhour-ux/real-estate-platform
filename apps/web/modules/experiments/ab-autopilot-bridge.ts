/**
 * Recommendation-only A/B actions — LOW risk; no auto UX swap.
 */

export const AB_TESTING_AUTOPILOT_ACTIONS = {
  AB_TEST_CREATE: {
    actionType: "AB_TEST_CREATE",
    domain: "growth",
    riskLevel: "LOW" as const,
    title: "Create draft A/B experiment",
    summary: "Use `createExperiment` in `ab-experiment.service` — publish variants manually after review.",
  },
  AB_TEST_REVIEW_RESULTS: {
    actionType: "AB_TEST_REVIEW_RESULTS",
    domain: "growth",
    riskLevel: "LOW" as const,
    title: "Review experiment results",
    summary: "Run `computeExperimentResults` + `decideExperimentOutcome` — audit rationale before any promotion.",
  },
  AB_TEST_PROMOTE_WINNER: {
    actionType: "AB_TEST_PROMOTE_WINNER",
    domain: "growth",
    riskLevel: "LOW" as const,
    title: "Promote winning variant (manual)",
    summary: "Apply winner copy in CMS/Ads UI after approval — LECIPM does not auto-switch production UX.",
  },
  AB_TEST_ITERATE_VARIANT: {
    actionType: "AB_TEST_ITERATE_VARIANT",
    domain: "growth",
    riskLevel: "LOW" as const,
    title: "Iterate challenger",
    summary: "Use `buildNextAbTestPlan` for follow-on tests when autonomous flag is on.",
  },
} as const;

export type AbTestingAutopilotActionKey = keyof typeof AB_TESTING_AUTOPILOT_ACTIONS;

export function listAbTestingAutopilotRecommendations(): (typeof AB_TESTING_AUTOPILOT_ACTIONS)[AbTestingAutopilotActionKey][] {
  return [
    AB_TESTING_AUTOPILOT_ACTIONS.AB_TEST_CREATE,
    AB_TESTING_AUTOPILOT_ACTIONS.AB_TEST_REVIEW_RESULTS,
    AB_TESTING_AUTOPILOT_ACTIONS.AB_TEST_PROMOTE_WINNER,
    AB_TESTING_AUTOPILOT_ACTIONS.AB_TEST_ITERATE_VARIANT,
  ];
}
