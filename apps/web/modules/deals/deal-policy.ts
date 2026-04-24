import type { PlatformRole } from "@prisma/client";
import type { LecipmPipelineDeal } from "@prisma/client";

export function canAccessPipelineDeal(
  role: PlatformRole,
  userId: string,
  deal: Pick<LecipmPipelineDeal, "brokerId" | "ownerUserId" | "sponsorUserId">
): boolean {
  if (role === "ADMIN") return true;
  if (deal.brokerId === userId) return true;
  if (deal.ownerUserId === userId) return true;
  if (deal.sponsorUserId === userId) return true;
  return false;
}

export function canSubmitToCommittee(role: PlatformRole): boolean {
  return role === "BROKER" || role === "ADMIN";
}

/** Committee decision + waive critical conditions. */
export function canRecordCommitteeDecision(role: PlatformRole): boolean {
  return role === "ADMIN" || role === "INVESTOR";
}

export function canWaiveCriticalCondition(role: PlatformRole): boolean {
  return role === "ADMIN";
}

export const PIPELINE_STAGES = [
  "SOURCED",
  "SCREENING",
  "PRELIMINARY_REVIEW",
  "IC_PREP",
  "IC_REVIEW",
  "CONDITIONAL_APPROVAL",
  "APPROVED",
  "EXECUTION",
  "CLOSED",
  "DECLINED",
  "ON_HOLD",
] as const;

export const TERMINAL_STAGES: string[] = ["CLOSED", "DECLINED"];
