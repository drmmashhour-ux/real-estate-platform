import type { ComplianceSeverity } from "@/modules/compliance/core/rule-types";

const ORDER: ComplianceSeverity[] = ["low", "medium", "high", "critical"];

export function severityRank(s: ComplianceSeverity): number {
  return ORDER.indexOf(s);
}

export function maxSeverity(a: ComplianceSeverity, b: ComplianceSeverity): ComplianceSeverity {
  return severityRank(a) >= severityRank(b) ? a : b;
}
