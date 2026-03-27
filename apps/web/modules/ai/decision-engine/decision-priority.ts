import type { DecisionRiskItem, PriorityLevel } from "./decision-types";

const SEVERITY_RANK: Record<string, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

/**
 * Derive platform priority from risk severities and hub heuristics.
 * CRITICAL: payment, legal, fraud/suspicious
 * HIGH: new lead/booking, expiring time-sensitive
 * MEDIUM: incomplete / pending work
 * LOW: optimizations
 */
export function priorityFromRisks(risks: DecisionRiskItem[], hubHints: PriorityLevel | null): PriorityLevel {
  if (hubHints === "critical") return "critical";
  let max = 0;
  for (const r of risks) {
    max = Math.max(max, SEVERITY_RANK[r.severity] ?? 0);
  }
  if (max >= 4) return "critical";
  if (max >= 3) return "high";
  if (max >= 2) return "medium";
  if (hubHints) return hubHints;
  return "low";
}

export function priorityLabel(p: PriorityLevel): string {
  switch (p) {
    case "critical":
      return "Critical — review now";
    case "high":
      return "High priority";
    case "medium":
      return "Medium priority";
    default:
      return "Low priority";
  }
}
