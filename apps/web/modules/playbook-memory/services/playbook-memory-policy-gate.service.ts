import type { MemoryDomain, MemoryPlaybook, PlaybookExecutionMode, PlaybookScoreBand, PlaybookStatus } from "@prisma/client";
import {
  DISALLOW_AUTOPILOT_ACTION_TYPES,
  HIGH_RISK_MEMORY_DOMAINS,
  PLAYBOOK_GOVERNANCE_MAX_AVG_RISK,
  PLAYBOOK_RISK_SCORE_FAIL,
} from "../constants/playbook-memory.constants";
import { playbookTelemetry } from "../playbook-memory.telemetry";
import type { PlaybookComparableContext } from "../types/playbook-memory.types";
import type { PolicyGateResult } from "../types/playbook-memory.types";

export type PolicyGateInput = {
  playbook: Pick<MemoryPlaybook, "status" | "executionMode" | "domain">;
  context: PlaybookComparableContext;
  actionType?: string;
  policySnapshot?: Record<string, unknown>;
  riskSnapshot?: Record<string, unknown>;
  autonomyHint?: PlaybookExecutionMode;
};

/** Optional autonomy hint for execution (OFF = no automation; ASSIST = human-in-the-loop). */
export type AutonomyModeHint = PlaybookExecutionMode | "OFF" | "RECOMMEND_ONLY" | "NONE" | "ASSIST";

export type PlaybookGovernanceInput = {
  status: PlaybookStatus;
  executionMode: PlaybookExecutionMode;
  scoreBand: PlaybookScoreBand;
  avgRiskScore: number | null | undefined;
  policyFlags?: { criticalBlock?: boolean };
  /** Requested or effective autonomy for this decision (HUMAN_APPROVAL allows recommendations only). */
  autonomyMode?: AutonomyModeHint;
  domain?: MemoryDomain;
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
  if (typeof score === "number" && score > PLAYBOOK_RISK_SCORE_FAIL) return true;
  return false;
}

function isAutonomyOff(mode?: AutonomyModeHint): boolean {
  if (mode == null) return false;
  return mode === "OFF" || mode === "NONE" || mode === "RECOMMEND_ONLY";
}

/**
 * Recommendation / runtime gate (context + action). Used by retrieval. Keep stable for existing callers.
 */
export function evaluateRecommendationPolicy(input: PolicyGateInput): PolicyGateResult {
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

/**
 * Wave 6: deterministic governance (status, mode, risk, autonomy). No I/O.
 * RECOMMEND_ONLY is allowed when ACTIVE, no critical policy flag, and avg risk (if any) is within the max.
 */
export function evaluatePlaybookEligibility(input: PlaybookGovernanceInput): PolicyGateResult {
  const blocked: string[] = [];

  if (input.status !== "ACTIVE") {
    blocked.push(`playbook_status_${input.status}`);
  }
  if (input.policyFlags?.criticalBlock) {
    blocked.push("policy_critical_block");
  }
  const risk = input.avgRiskScore;
  if (risk != null && Number.isFinite(risk) && risk > PLAYBOOK_GOVERNANCE_MAX_AVG_RISK) {
    blocked.push("avg_risk_exceeds_governance_max");
  }

  if (input.executionMode === "RECOMMEND_ONLY" && blocked.length === 0) {
    return { allowed: true, blockedReasons: [] };
  }

  if (input.executionMode === "FULL_AUTOPILOT") {
    const am = input.autonomyMode;
    if (am !== "FULL_AUTOPILOT" && am !== "SAFE_AUTOPILOT") {
      blocked.push("full_autopilot_not_allowed_by_autonomy");
    }
    if (input.domain && HIGH_RISK_MEMORY_DOMAINS.has(input.domain)) {
      blocked.push("domain_requires_lower_autonomy");
    }
  }
  if (input.executionMode === "SAFE_AUTOPILOT") {
    const am = input.autonomyMode;
    if (am !== "SAFE_AUTOPILOT" && am !== "FULL_AUTOPILOT") {
      blocked.push("safe_autopilot_not_allowed_by_autonomy");
    }
  }
  if (input.executionMode === "HUMAN_APPROVAL") {
    if (isAutonomyOff(input.autonomyMode)) {
      blocked.push("human_approval_not_allowed_when_autonomy_off");
    }
  }

  if (blocked.length) {
    playbookTelemetry.blockedCount += 1;
  }
  return { allowed: blocked.length === 0, blockedReasons: blocked };
}

export function isExecutionModeAllowed(params: {
  domain?: MemoryDomain;
  executionMode: PlaybookExecutionMode;
  autonomyMode?: AutonomyModeHint;
}): PolicyGateResult {
  return evaluatePlaybookEligibility({
    status: "ACTIVE",
    executionMode: params.executionMode,
    scoreBand: "MEDIUM",
    avgRiskScore: 0,
    policyFlags: { criticalBlock: false },
    autonomyMode: params.autonomyMode,
    domain: params.domain,
  });
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
