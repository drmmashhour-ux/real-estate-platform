import { prisma } from "@/lib/db";
import { EXECUTIVE_POLICY_VERSION } from "./executive-versions";
import { executiveLog } from "./executive-log";

export type AutonomyMode = "OFF" | "ASSIST" | "SAFE_APPROVAL" | "AUTO_LOW_RISK";

export const POLICY_GUARDRAILS = [
  "Never auto-approve committee, financing, or legal decisions.",
  "Never auto-confirm closing or close compliance incidents.",
  "Never present estimated evidence as verified fact.",
  "Always allow human override; blockers must stay visible.",
] as const;

export async function getOrCreateExecutivePolicy(userId: string) {
  return prisma.executivePolicy.upsert({
    where: { ownerId: userId },
    create: { ownerId: userId, policyVersion: EXECUTIVE_POLICY_VERSION },
    update: {},
  });
}

export function canAutoOpenLowRiskTask(
  policy: { autonomyMode: string; allowLowRiskAutoTasks: boolean; allowAutoApprovals: boolean },
): boolean {
  if (policy.autonomyMode === "OFF") return false;
  if (policy.autonomyMode === "ASSIST") return false;
  if (!policy.allowLowRiskAutoTasks) return false;
  if (policy.autonomyMode === "AUTO_LOW_RISK") return true;
  return false;
}

export function mustRequireHumanForMaterial(
  taskFamily: "MATERIAL" | "LOW_RISK",
  policy: { allowAutoApprovals: boolean; autonomyMode: string },
): boolean {
  if (taskFamily === "MATERIAL") return true;
  if (policy.autonomyMode === "OFF" || policy.autonomyMode === "ASSIST" || policy.autonomyMode === "SAFE_APPROVAL")
    return true;
  if (taskFamily === "LOW_RISK" && policy.autonomyMode === "AUTO_LOW_RISK" && policy.allowAutoApprovals) {
    executiveLog.policy("deny_auto_approval_low_risk", { reason: "auto-approvals disabled for all by default" });
  }
  return true;
}
