/**
 * Enforcement lookups — deterministic, no mutation.
 */

import type {
  GrowthEnforcementMode,
  GrowthEnforcementTarget,
  GrowthPolicyEnforcementDecision,
  GrowthPolicyEnforcementSnapshot,
} from "./growth-policy-enforcement.types";

export function getEnforcementForTarget(
  target: GrowthEnforcementTarget,
  snapshot: GrowthPolicyEnforcementSnapshot,
): GrowthPolicyEnforcementDecision {
  const r = snapshot.rules.find((x) => x.target === target);
  return {
    target,
    mode: r?.mode ?? "allow",
    rationale: r?.rationale ?? "No rule — default allow.",
  };
}

export function isTargetBlocked(target: GrowthEnforcementTarget, snapshot: GrowthPolicyEnforcementSnapshot): boolean {
  return snapshot.blockedTargets.includes(target);
}

export function isTargetFrozen(target: GrowthEnforcementTarget, snapshot: GrowthPolicyEnforcementSnapshot): boolean {
  return snapshot.frozenTargets.includes(target);
}

export function isTargetApprovalRequired(
  target: GrowthEnforcementTarget,
  snapshot: GrowthPolicyEnforcementSnapshot,
): boolean {
  return snapshot.approvalRequiredTargets.includes(target);
}

/**
 * Whether a target may be elevated into promotion / conversion helpers (simulation, strategy, bridges).
 */
export function canPromoteTarget(target: GrowthEnforcementTarget, snapshot: GrowthPolicyEnforcementSnapshot): boolean {
  const d = getEnforcementForTarget(target, snapshot);
  return d.mode === "allow";
}
