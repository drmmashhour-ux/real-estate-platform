/**
 * Overall mission control posture — simple, explainable rules only.
 */

import type { GrowthDailyBrief } from "./growth-daily-brief.types";
import type { GrowthExecutiveSummary } from "./growth-executive.types";
import type { GrowthGovernanceDecision } from "./growth-governance.types";
import type { GrowthMissionControlRisk } from "./growth-mission-control.types";
import type { GrowthMissionControlStatus } from "./growth-mission-control.types";

export function computeGrowthMissionControlStatus(args: {
  governance: GrowthGovernanceDecision | null;
  executive: GrowthExecutiveSummary | null;
  dailyBrief: GrowthDailyBrief | null;
  mergedRisks: GrowthMissionControlRisk[];
}): GrowthMissionControlStatus {
  const g = args.governance?.status;
  if (g === "human_review_required" || g === "freeze_recommended") {
    return "watch";
  }
  if (g === "caution") {
    return "watch";
  }

  const execStatus = args.executive?.status;
  const briefStatus = args.dailyBrief?.status;
  const totalLeads = args.executive?.leadSummary.totalLeads ?? 0;
  const highRisk = args.mergedRisks.filter((r) => r.severity === "high").length;

  if (execStatus === "weak" || (briefStatus === "weak" && totalLeads < 5)) {
    return "weak";
  }

  if (
    execStatus === "strong" &&
    briefStatus === "strong" &&
    highRisk === 0 &&
    (g === "healthy" || g == null)
  ) {
    return "strong";
  }

  if (execStatus === "healthy" && highRisk <= 1) {
    return "healthy";
  }

  return "healthy";
}
