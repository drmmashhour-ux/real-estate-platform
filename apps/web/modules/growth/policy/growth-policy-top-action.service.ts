/**
 * Pick the single best next step — governance blockers beat generic criticals when both exist.
 */

import type { GrowthPolicyAction } from "@/modules/growth/policy/growth-policy-actions.types";

const severityRank: Record<GrowthPolicyAction["severity"], number> = {
  critical: 0,
  warning: 1,
  info: 2,
};

const actionRank: Record<GrowthPolicyAction["actionType"], number> = {
  review: 0,
  navigate: 1,
  inspect: 2,
  compare: 3,
  resolve_manually: 4,
};

/** Governance “blockers” — non-info governance findings take priority over non-governance items at same severity tier. */
function governanceBlocker(a: GrowthPolicyAction): boolean {
  return a.domain === "governance" && a.severity !== "info";
}

export function selectTopPolicyAction(actions: GrowthPolicyAction[]): GrowthPolicyAction | undefined {
  if (actions.length === 0) return undefined;
  const sorted = [...actions].sort((a, b) => {
    const sev = severityRank[a.severity] - severityRank[b.severity];
    if (sev !== 0) return sev;
    const gov = Number(governanceBlocker(b)) - Number(governanceBlocker(a));
    if (gov !== 0) return gov;
    const act = actionRank[a.actionType] - actionRank[b.actionType];
    if (act !== 0) return act;
    return a.policyId.localeCompare(b.policyId);
  });
  return sorted[0];
}
