import type { ComplianceRuleResult } from "@/modules/compliance/core/rule-types";
import { maxSeverity } from "@/modules/compliance/core/severity";
import type { ComplianceSeverity } from "@/modules/compliance/core/rule-types";

export type ComplianceOverallStatus = "compliant" | "warning" | "review_required" | "blocked";

export type ComplianceDecision = {
  status: ComplianceOverallStatus;
  worstSeverity: ComplianceSeverity;
  blockingFailures: ComplianceRuleResult[];
  requiresManualReview: boolean;
};

export function computeComplianceDecision(results: ComplianceRuleResult[]): ComplianceDecision {
  const evaluated = results.filter((r) => !r.passed);
  const blockingFailures = evaluated.filter((r) => r.blocking === true);
  if (blockingFailures.length) {
    const worst = blockingFailures.reduce((acc, r) => maxSeverity(acc, r.severity), "low" as ComplianceSeverity);
    return {
      status: "blocked",
      worstSeverity: worst,
      blockingFailures,
      requiresManualReview: true,
    };
  }

  const critical = evaluated.filter((r) => r.severity === "critical");
  const high = evaluated.filter((r) => r.severity === "high");
  const medium = evaluated.filter((r) => r.severity === "medium");

  if (critical.length || high.length) {
    const worst = evaluated.reduce((acc, r) => maxSeverity(acc, r.severity), "low" as ComplianceSeverity);
    return {
      status: "review_required",
      worstSeverity: worst,
      blockingFailures: [],
      requiresManualReview: true,
    };
  }

  if (medium.length) {
    return {
      status: "warning",
      worstSeverity: "medium",
      blockingFailures: [],
      requiresManualReview: false,
    };
  }

  return {
    status: "compliant",
    worstSeverity: "low",
    blockingFailures: [],
    requiresManualReview: false,
  };
}
