/**
 * Admin / investor summaries for policy proposal reports — advisory copy only.
 */
import type { PolicyProposalReport } from "../proposals/policy-proposal.types";

export type PolicyProposalAdminDashboardSummary = {
  totalProposals: number;
  criticalCount: number;
  highCount: number;
  thresholdProposalCount: number;
  newRuleProposalCount: number;
  ruleOrderProposalCount: number;
  regionReviewCount: number;
  actionReviewCount: number;
  entityReviewCount: number;
  topProposalTitle?: string;
  topAffectedRegion?: string;
  topAffectedAction?: string;
  topAffectedEntity?: string;
  operationalSummary: string;
};

export type PolicyProposalInvestorDashboardSummary = {
  governanceImprovementPipelineStatus: string;
  controlAdaptationPosture: string;
  riskReductionOpportunityLevel: "low" | "moderate" | "elevated";
  narrative: string;
};

function topOccurrence(
  proposals: PolicyProposalReport["proposals"],
  pick: "regionCode" | "actionType" | "entityType",
): string | undefined {
  const counts = new Map<string, number>();
  for (const p of proposals) {
    const v = p.target[pick];
    if (!v) continue;
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  let best: string | undefined;
  let n = 0;
  for (const [k, c] of counts) {
    if (c > n) {
      n = c;
      best = k;
    }
  }
  return best;
}

export function buildPolicyProposalAdminSummary(report: PolicyProposalReport): PolicyProposalAdminDashboardSummary {
  const { proposals } = report;
  const thresholdProposalCount = proposals.filter((p) => p.type === "THRESHOLD_ADJUSTMENT").length;
  const newRuleProposalCount = proposals.filter((p) => p.type === "NEW_RULE").length;
  const ruleOrderProposalCount = proposals.filter((p) => p.type === "RULE_ORDER_REVIEW").length;
  const regionReviewCount = proposals.filter((p) => p.type === "REGION_POLICY_REVIEW").length;
  const actionReviewCount = proposals.filter((p) => p.type === "ACTION_POLICY_REVIEW").length;
  const entityReviewCount = proposals.filter((p) => p.type === "ENTITY_POLICY_REVIEW").length;

  const operationalSummary =
    proposals.length === 0 ?
      "No proposals queued — extend feedback windows or attach simulation batches if this surface should populate."
    : `${report.summary.totalProposals} advisory proposal(s): ${report.summary.criticalCount} critical, ${report.summary.highCount} high. Threshold ${thresholdProposalCount}, new-rule ${newRuleProposalCount}, rule-order ${ruleOrderProposalCount}. Human approval required before any activation.`;

  return {
    totalProposals: report.summary.totalProposals,
    criticalCount: report.summary.criticalCount,
    highCount: report.summary.highCount,
    thresholdProposalCount,
    newRuleProposalCount,
    ruleOrderProposalCount,
    regionReviewCount,
    actionReviewCount,
    entityReviewCount,
    topProposalTitle: report.summary.topPriorityTitle,
    topAffectedRegion: topOccurrence(proposals, "regionCode"),
    topAffectedAction: topOccurrence(proposals, "actionType"),
    topAffectedEntity: topOccurrence(proposals, "entityType"),
    operationalSummary,
  };
}

export function buildPolicyProposalInvestorSummary(report: PolicyProposalReport): PolicyProposalInvestorDashboardSummary {
  const n = report.summary.totalProposals;
  const critical = report.summary.criticalCount;

  let riskReductionOpportunityLevel: PolicyProposalInvestorDashboardSummary["riskReductionOpportunityLevel"] = "low";
  if (critical >= 2 || report.summary.highCount >= 4) riskReductionOpportunityLevel = "elevated";
  else if (n >= 4 || report.summary.highCount >= 2) riskReductionOpportunityLevel = "moderate";

  const governanceImprovementPipelineStatus =
    n === 0 ?
      "Observation pipeline idle — awaiting labeled outcomes and sandbox runs."
    : `Structured review queue active with ${n} documented recommendation(s).`;

  const controlAdaptationPosture =
    riskReductionOpportunityLevel === "elevated" ?
      "Elevated advisory load — governance team should prioritize staged reviews."
    : riskReductionOpportunityLevel === "moderate" ?
      "Moderate tuning opportunities identified — sequential human validation recommended."
    : "Stable posture — incremental governance refinement only.";

  const narrative =
    "Policy proposals are generated deterministically from feedback, clusters, drift, and offline simulation. " +
    "They do not activate automatically; each item requires explicit human approval before configuration changes.";

  return {
    governanceImprovementPipelineStatus,
    controlAdaptationPosture,
    riskReductionOpportunityLevel,
    narrative,
  };
}
