/**
 * Aggregate metrics from classified feedback rows — deterministic, no side effects.
 */
import type { GovernanceFeedbackResult, GovernancePerformanceSummary } from "./governance-feedback.types";

export function buildGovernancePerformanceSummary(results: GovernanceFeedbackResult[]): GovernancePerformanceSummary {
  const totalCases = results.length;

  const goodBlocks = results.filter((r) => r.label === "GOOD_BLOCK").length;
  const badBlocks = results.filter((r) => r.label === "BAD_BLOCK").length;
  const goodApprovals = results.filter((r) => r.label === "GOOD_APPROVAL").length;
  const badApprovals = results.filter((r) => r.label === "BAD_APPROVAL").length;
  const goodExecutions = results.filter((r) => r.label === "GOOD_EXECUTION").length;
  const badExecutions = results.filter((r) => r.label === "BAD_EXECUTION").length;
  const missedRiskCases = results.filter((r) => r.label === "MISSED_RISK").length;

  const falsePositiveCount = results.filter((r) => r.falsePositive).length;
  const falseNegativeCount = results.filter((r) => r.falseNegative).length;

  const protectedRevenueEstimate = results.reduce((sum, r) => sum + r.protectedRevenueEstimate, 0);
  const leakedRevenueEstimate = results.reduce((sum, r) => sum + r.leakedRevenueEstimate, 0);

  return {
    totalCases,
    goodBlocks,
    badBlocks,
    goodApprovals,
    badApprovals,
    goodExecutions,
    badExecutions,
    missedRiskCases,
    falsePositiveRate: totalCases > 0 ? falsePositiveCount / totalCases : 0,
    falseNegativeRate: totalCases > 0 ? falseNegativeCount / totalCases : 0,
    protectedRevenueEstimate,
    leakedRevenueEstimate,
  };
}
