/**
 * Rollout / UI helpers — deterministic, no I/O (testable).
 */

import type { GrowthPolicyEnforcementSnapshot } from "./growth-policy-enforcement.types";

/** Snapshot may be incomplete — treat advisory modes as directional only. */
export function policyEnforcementSnapshotLooksPartial(s: GrowthPolicyEnforcementSnapshot): boolean {
  if (s.inputCompleteness === "partial") return true;
  if (s.missingDataWarnings.length > 0) return true;
  return s.notes.some((n) => n.includes("Partial inputs"));
}
