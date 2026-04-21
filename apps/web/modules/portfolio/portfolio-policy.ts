import type { PolicyAutonomyMode } from "./portfolio.types";

export const AUTONOMY_MODES: PolicyAutonomyMode[] = ["OFF", "ASSIST", "SAFE_APPROVAL", "AUTO_LOW_RISK"];

/** Hard guardrails — narrative list for UI + audits (Part 10). Never bypass in code paths that execute actions. */
export const POLICY_GUARDRAILS = [
  "Never auto-allocate binding capital without explicit approval workflow.",
  "Never auto-close compliance incidents or waive critical conditions.",
  "Never auto-approve material financing or legal commitments.",
  "Never hide critical risks in exported summaries.",
  "Never present estimated/market-implied values as independently verified facts.",
  "Always allow human override on recommendations.",
] as const;

export function canAutoActivateLowRisk(autonomyMode: PolicyAutonomyMode): boolean {
  return autonomyMode === "AUTO_LOW_RISK";
}

export function shouldGeneratePlans(autonomyMode: PolicyAutonomyMode): boolean {
  return autonomyMode !== "OFF";
}

export function requiresApprovalForPlans(autonomyMode: PolicyAutonomyMode): boolean {
  return autonomyMode === "SAFE_APPROVAL" || autonomyMode === "AUTO_LOW_RISK" || autonomyMode === "ASSIST";
}
