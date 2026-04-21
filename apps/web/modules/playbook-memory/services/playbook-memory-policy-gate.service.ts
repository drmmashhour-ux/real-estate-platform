import type { MemoryDomain, MemoryPlaybook, PlaybookExecutionMode } from "@prisma/client";
import {
  DISALLOW_AUTOPILOT_ACTION_TYPES,
  HIGH_RISK_MEMORY_DOMAINS,
} from "../constants/playbook-memory.constants";
import { playbookTelemetry } from "../playbook-memory.telemetry";
import type { PlaybookComparableContext } from "../types/playbook-memory.types";

export type PolicyGateInput = {
  playbook: Pick<MemoryPlaybook, "status" | "executionMode" | "domain">;
  context: PlaybookComparableContext;
  actionType?: string;
  /** Optional snapshot from upstream policy engine (critical flag). */
  policySnapshot?: Record<string, unknown>;
  riskSnapshot?: Record<string, unknown>;
  autonomyHint?: PlaybookExecutionMode;
};

function hasCriticalPolicyBlock(snapshot?: Record<string, unknown>): boolean {
  if (!snapshot) return false;
  const sev = snapshot.severity ?? snapshot.policySeverity;
  if (typeof sev === "string" && sev.toLowerCase() === "critical") return true;
  if (snapshot.critical === true) return true;
  if (snapshot.freeze === true) return true;
  return false;
}

function riskExceeded(riskSnapshot?: Record<string, unknown>): boolean {
  if (!riskSnapshot) return false;
  if (riskSnapshot.thresholdExceeded === true) return true;
  const score = riskSnapshot.riskScore;
  if (typeof score === "number" && score > 0.92) return true;
  return false;
}

/** Returns whether execution is allowed and detailed block reasons. */
export function evaluatePlaybookEligibility(input: PolicyGateInput): {
  allowed: boolean;
  blockedReasons: string[];
} {
  const blockedReasons: string[] = [];

  if (input.playbook.status !== "ACTIVE") {
    blockedReasons.push(`playbook_status_${input.playbook.status}`);
  }

  if (hasCriticalPolicyBlock(input.policySnapshot)) {
    blockedReasons.push("policy_critical_block");
  }

  if (riskExceeded(input.riskSnapshot)) {
    blockedReasons.push("risk_threshold_exceeded");
  }

  if (HIGH_RISK_MEMORY_DOMAINS.has(input.playbook.domain) && input.playbook.executionMode === "FULL_AUTOPILOT") {
    blockedReasons.push("domain_requires_lower_autonomy");
  }

  const at = input.actionType ?? "";
  if (DISALLOW_AUTOPILOT_ACTION_TYPES.has(at)) {
    blockedReasons.push("action_type_requires_human_channel");
  }

  const allowed = blockedReasons.length === 0;
  if (!allowed) playbookTelemetry.blockedCount += 1;
  return { allowed, blockedReasons };
}

export function evaluateExecutionMode(
  domain: MemoryDomain,
  requested: PlaybookExecutionMode,
): { ok: boolean; reason?: string } {
  if (HIGH_RISK_MEMORY_DOMAINS.has(domain) && (requested === "FULL_AUTOPILOT" || requested === "SAFE_AUTOPILOT")) {
    return { ok: false, reason: "domain_restricted_execution_mode" };
  }
  return { ok: true };
}
