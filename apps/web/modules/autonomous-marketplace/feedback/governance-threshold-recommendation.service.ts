/**
 * Advisory threshold suggestions — human review only; never mutates live config in v1.
 */
import type {
  GovernanceFeedbackResult,
  GovernancePerformanceSummary,
  GovernanceThresholdRecommendation,
} from "./governance-feedback.types";

export function recommendGovernanceThresholdAdjustments(args: {
  summary: GovernancePerformanceSummary;
  results: GovernanceFeedbackResult[];
}): GovernanceThresholdRecommendation[] {
  try {
    const recommendations: GovernanceThresholdRecommendation[] = [];
    const { summary, results } = args;

    const badBlocks = results.filter((r) => r.label === "BAD_BLOCK").length;
    const missedRisk = results.filter(
      (r) => r.label === "MISSED_RISK" || r.label === "BAD_EXECUTION" || r.label === "BAD_APPROVAL",
    ).length;

    if (summary.totalCases >= 10 && badBlocks / summary.totalCases >= 0.15) {
      recommendations.push({
        metricKey: "combinedRisk.mediumThreshold",
        direction: "increase",
        confidence: badBlocks >= 5 ? "HIGH" : "MEDIUM",
        rationale: "High bad-block rate suggests over-conservative review/block thresholds.",
        evidenceCount: badBlocks,
      });
    }

    if (summary.totalCases >= 10 && missedRisk / summary.totalCases >= 0.12) {
      recommendations.push({
        metricKey: "combinedRisk.highThreshold",
        direction: "decrease",
        confidence: missedRisk >= 5 ? "HIGH" : "MEDIUM",
        rationale: "Missed harmful outcomes suggest thresholds are too permissive.",
        evidenceCount: missedRisk,
      });
    }

    if (summary.leakedRevenueEstimate > summary.protectedRevenueEstimate) {
      recommendations.push({
        metricKey: "fraudRevenueRisk.anomalySensitivity",
        direction: "decrease",
        confidence: "MEDIUM",
        rationale:
          "Revenue leakage exceeds protected revenue estimate, suggesting anomaly sensitivity should tighten.",
        evidenceCount: summary.totalCases,
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        metricKey: "governance.overall",
        direction: "hold",
        confidence: "LOW",
        rationale: "Current evidence does not support a threshold adjustment.",
        evidenceCount: summary.totalCases,
      });
    }

    return recommendations;
  } catch {
    return [
      {
        metricKey: "governance.overall",
        direction: "hold",
        confidence: "LOW",
        rationale: "Recommendation fallback triggered.",
        evidenceCount: 0,
      },
    ];
  }
}
