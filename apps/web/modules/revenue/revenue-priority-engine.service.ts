/**
 * Merge leaks + dashboard alerts — biggest revenue impact first.
 */

import type { RankedProblem, RevenueLeak } from "./money-os.types";
import type { RevenueAlert } from "./revenue-dashboard.types";

export function rankProblems(leaks: RevenueLeak[], alerts: RevenueAlert[]): RankedProblem[] {
  const fromLeaks: RankedProblem[] = leaks.map((l) => ({
    id: l.id,
    title: l.title,
    detail: l.detail,
    impactScore: l.impactScore,
    kind: "leak" as const,
  }));

  const fromAlerts: RankedProblem[] = alerts.map((a) => ({
    id: a.id,
    title: a.title,
    detail: a.description,
    impactScore: mapAlertToImpact(a),
    kind: "alert" as const,
  }));

  return [...fromLeaks, ...fromAlerts].sort((a, b) => b.impactScore - a.impactScore);
}

function mapAlertToImpact(a: RevenueAlert): number {
  if (typeof a.priorityScore === "number") return a.priorityScore;
  if (a.level === "critical") return 95;
  if (a.level === "warning") return 80;
  return 55;
}
