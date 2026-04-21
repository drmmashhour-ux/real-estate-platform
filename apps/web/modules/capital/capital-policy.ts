import { PlatformRole } from "@prisma/client";

/** Pipeline stages where capital planning is typically appropriate */
export const CAPITAL_ELIGIBLE_STAGES = new Set([
  "CONDITIONAL_APPROVAL",
  "APPROVED",
  "EXECUTION",
  "IC_REVIEW",
]);

const APPROVED_DECISION_STATUSES = new Set(["PROCEED", "PROCEED_WITH_CONDITIONS"]);

/** Approved / conditional approval style eligibility for capital spine (deterministic). */
export function dealEligibleForCapitalStack(deal: {
  pipelineStage: string;
  decisionStatus: string | null | undefined;
}): boolean {
  if (CAPITAL_ELIGIBLE_STAGES.has(deal.pipelineStage)) return true;
  const ds = deal.decisionStatus ?? "";
  return APPROVED_DECISION_STATUSES.has(ds);
}

export function userCanElevatedCapitalOps(role: PlatformRole | string): boolean {
  return (
    role === PlatformRole.ADMIN ||
    role === PlatformRole.BROKER ||
    role === PlatformRole.ACCOUNTANT
  );
}
