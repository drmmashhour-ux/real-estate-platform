/**
 * Maps policy evaluation into a compliance gate snapshot for controlled execution.
 * Deterministic; never throws.
 */
import type { PolicyDecision } from "../types/domain.types";
import { legalPolicyDecisionToGateResult } from "@/modules/legal/legal-policy-bridge";
import type { ComplianceGateSnapshot } from "./controlled-execution.types";

export function buildComplianceGateSnapshotFromPolicy(policy: PolicyDecision): ComplianceGateSnapshot {
  try {
    const gate = legalPolicyDecisionToGateResult(policy);
    const blocked = gate.allowed === false && gate.mode === "hard";
    const reasonCode =
      gate.reasons.length > 0 ? gate.reasons[0].slice(0, 120) : blocked ? "legal_gate_hard_block" : undefined;
    return { blocked, reasonCode };
  } catch {
    return { blocked: false };
  }
}
