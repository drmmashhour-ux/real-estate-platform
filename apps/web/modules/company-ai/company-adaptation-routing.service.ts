import type { CompanyAdaptationType, CompanyStrategyDomain } from "@prisma/client";

export type AdaptationRoutePlan = {
  /** Downstream systems that should consume this proposal (soft signals only until rolled out). */
  targets: string[];
  /** When true, must not auto-apply outside human / CEO policy approval. */
  requiresHumanApproval: boolean;
  rationale: string;
};

const ALWAYS_REVIEW_TYPES: CompanyAdaptationType[] = [
  "RISK_TIGHTENING",
  "RESOURCE_REALLOCATION",
  "SEGMENT_FOCUS_CHANGE",
];

/**
 * Routes adaptations to conceptual consumers. Does not execute binding changes.
 */
export function routeCompanyAdaptation(input: {
  adaptationType: CompanyAdaptationType;
  domain: CompanyStrategyDomain;
  confidenceScore: number;
}): AdaptationRoutePlan {
  const targets: string[] = ["CEO_COMMAND_LAYER", "COMPANY_AI_DASHBOARD"];

  if (input.domain === "MARKETPLACE" || input.adaptationType === "EXPERIMENT_RECOMMENDATION") {
    targets.push("BNHUB_RECOMMENDATION_ENGINES", "PRICING_ROLLOUT_FLAGS");
  }
  if (input.domain === "DEALS" || input.domain === "EXECUTION") {
    targets.push("COMMAND_CENTER_SIGNALS", "EXECUTION_QUEUE_THRESHOLDS");
  }
  if (input.domain === "INVESTMENT") {
    targets.push("PORTFOLIO_OPTIMIZATION_AI", "INVESTOR_MATCHING_PREFERENCES");
  }
  if (input.domain === "GROWTH") {
    targets.push("RANKING_AND_RECOMMENDATION_WEIGHTS");
  }
  if (input.domain === "ESG") {
    targets.push("ESG_RETROFIT_AUTOPILOT_HINTS");
  }
  if (input.domain === "FINANCE") {
    targets.push("FINANCE_COMPLIANCE_HUB");
  }

  const highImpact = ALWAYS_REVIEW_TYPES.includes(input.adaptationType) || input.confidenceScore >= 0.82;
  const requiresHumanApproval = highImpact || input.confidenceScore >= 0.75;

  return {
    targets: [...new Set(targets)],
    requiresHumanApproval,
    rationale: requiresHumanApproval
      ? "Structural or high-confidence shift — human approval required before rollout systems consume weights."
      : "Low-impact experiment — may flow through existing rollout gates with monitoring.",
  };
}
