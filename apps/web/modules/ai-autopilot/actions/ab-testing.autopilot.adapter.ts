import { abTestingFlags, aiAutopilotV1Flags, engineFlags } from "@/config/feature-flags";
import { AB_TESTING_AUTOPILOT_ACTIONS } from "@/modules/experiments/ab-autopilot-bridge";
import type { ProposedAction } from "../ai-autopilot.types";

export function proposalsAbTestingAutopilot(userId: string): ProposedAction[] {
  void userId;
  if (
    !engineFlags.growthMachineV1 ||
    !aiAutopilotV1Flags.aiAutopilotV1 ||
    !aiAutopilotV1Flags.growthDomain ||
    !abTestingFlags.abTestingV1
  ) {
    return [];
  }

  const a = AB_TESTING_AUTOPILOT_ACTIONS;
  return [
    {
      domain: "growth",
      entityType: "ab_testing",
      entityId: "create",
      actionType: a.AB_TEST_CREATE.actionType,
      title: a.AB_TEST_CREATE.title,
      summary: a.AB_TEST_CREATE.summary,
      severity: "low",
      riskLevel: "LOW",
      recommendedPayload: { module: "modules/experiments/ab-experiment.service", mode: "RECOMMENDATION_ONLY" },
      reasons: { confidence: 0.5 },
      subjectUserId: null,
      audience: "admin",
    },
    {
      domain: "growth",
      entityType: "ab_testing",
      entityId: "review",
      actionType: a.AB_TEST_REVIEW_RESULTS.actionType,
      title: a.AB_TEST_REVIEW_RESULTS.title,
      summary: a.AB_TEST_REVIEW_RESULTS.summary,
      severity: "low",
      riskLevel: "LOW",
      recommendedPayload: {
        modules: ["modules/experiments/ab-results.service", "modules/experiments/ab-decision.service"],
        mode: "RECOMMENDATION_ONLY",
      },
      reasons: { confidence: 0.52 },
      subjectUserId: null,
      audience: "admin",
    },
    {
      domain: "growth",
      entityType: "ab_testing",
      entityId: "promote",
      actionType: a.AB_TEST_PROMOTE_WINNER.actionType,
      title: a.AB_TEST_PROMOTE_WINNER.title,
      summary: a.AB_TEST_PROMOTE_WINNER.summary,
      severity: "low",
      riskLevel: "LOW",
      recommendedPayload: { requiresApproval: true, mode: "MANUAL_PROMOTION_ONLY" },
      reasons: { confidence: 0.48 },
      subjectUserId: null,
      audience: "admin",
    },
    {
      domain: "growth",
      entityType: "ab_testing",
      entityId: "iterate",
      actionType: a.AB_TEST_ITERATE_VARIANT.actionType,
      title: a.AB_TEST_ITERATE_VARIANT.title,
      summary: a.AB_TEST_ITERATE_VARIANT.summary,
      severity: "low",
      riskLevel: "LOW",
      recommendedPayload: {
        module: "modules/experiments/ab-test-plan.service",
        gatedBy: "FEATURE_AB_TESTING_AUTONOMOUS_V1",
      },
      reasons: { confidence: 0.46 },
      subjectUserId: null,
      audience: "admin",
    },
  ];
}
