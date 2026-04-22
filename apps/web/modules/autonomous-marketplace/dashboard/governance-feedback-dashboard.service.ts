/**
 * Feedback intelligence summaries for admin / investor surfaces — derived metrics only.
 */
import type { GovernancePerformanceSummary, GovernanceThresholdRecommendation } from "../feedback/governance-feedback.types";

export type GovernanceFeedbackAdminDashboardSummary = {
  totalCases: number;
  falsePositiveRate: number;
  falseNegativeRate: number;
  goodBlocks: number;
  badBlocks: number;
  missedRiskCases: number;
  goodApprovals: number;
  badApprovals: number;
  goodExecutions: number;
  badExecutions: number;
  protectedRevenueEstimate: number;
  leakedRevenueEstimate: number;
  topRecommendation: GovernanceThresholdRecommendation | null;
  governanceQualityPosture: "strong" | "mixed" | "needs_attention";
};

export type GovernanceFeedbackInvestorDashboardSummary = {
  aiProtectionEffectiveness: string;
  revenueLeakagePreventedEstimate: number;
  oversightQuality: string;
  anomalyContainmentPosture: string;
  narrativeSummary: string;
};

function postureFromRates(fp: number, fn: number): GovernanceFeedbackAdminDashboardSummary["governanceQualityPosture"] {
  if (fp + fn < 0.12) return "strong";
  if (fp + fn < 0.28) return "mixed";
  return "needs_attention";
}

export function buildGovernanceFeedbackAdminSummary(args: {
  summary: GovernancePerformanceSummary;
  recommendations: GovernanceThresholdRecommendation[];
}): GovernanceFeedbackAdminDashboardSummary {
  const top =
    args.recommendations.find((r) => r.direction !== "hold") ??
    args.recommendations[0] ??
    null;
  return {
    totalCases: args.summary.totalCases,
    falsePositiveRate: args.summary.falsePositiveRate,
    falseNegativeRate: args.summary.falseNegativeRate,
    goodBlocks: args.summary.goodBlocks,
    badBlocks: args.summary.badBlocks,
    missedRiskCases: args.summary.missedRiskCases,
    goodApprovals: args.summary.goodApprovals,
    badApprovals: args.summary.badApprovals,
    goodExecutions: args.summary.goodExecutions,
    badExecutions: args.summary.badExecutions,
    protectedRevenueEstimate: args.summary.protectedRevenueEstimate,
    leakedRevenueEstimate: args.summary.leakedRevenueEstimate,
    topRecommendation: top,
    governanceQualityPosture: postureFromRates(
      args.summary.falsePositiveRate,
      args.summary.falseNegativeRate,
    ),
  };
}

export function buildGovernanceFeedbackInvestorSummary(args: {
  summary: GovernancePerformanceSummary;
}): GovernanceFeedbackInvestorDashboardSummary {
  const leaked = args.summary.leakedRevenueEstimate;
  const protectedEst = args.summary.protectedRevenueEstimate;
  const containment =
    leaked <= protectedEst * 0.5 && args.summary.falseNegativeRate < 0.15
      ? "contained"
      : leaked > protectedEst
        ? "elevated"
        : "monitored";

  return {
    aiProtectionEffectiveness:
      args.summary.falseNegativeRate < 0.12
        ? "Protections align well with downstream outcomes."
        : "Elevated missed-risk rate — governance remains rule-based and auditable.",
    revenueLeakagePreventedEstimate: Math.max(0, protectedEst - leaked),
    oversightQuality:
      args.summary.badApprovals + args.summary.missedRiskCases < 5
        ? "Human oversight and escalation paths are tracking operational truth."
        : "Additional operator review of escalations is advised.",
    anomalyContainmentPosture: containment,
    narrativeSummary: `Composite feedback across ${args.summary.totalCases} labeled cases: estimated protection ${protectedEst.toFixed(0)} vs leakage ${leaked.toFixed(0)} (advisory, not financial accounting).`,
  };
}
