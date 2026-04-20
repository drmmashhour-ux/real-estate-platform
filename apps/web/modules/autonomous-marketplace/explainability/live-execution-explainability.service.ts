/**
 * Deterministic explainability for controlled live execution — no LLM; admin-safe wording.
 */
import type { ControlledExecutionDecision } from "../execution/controlled-execution.types";
import type { SafeExecutionGateOutput } from "../execution/safe-execution-gate.service";

export type LiveExecutionExplanation = {
  summary: string;
  bullets: readonly string[];
};

export function explainControlledExecutionDecision(params: {
  gate: SafeExecutionGateOutput;
  decision: ControlledExecutionDecision;
}): LiveExecutionExplanation {
  const bullets: string[] = [];

  if (params.gate.reasons.includes("compliance_block")) {
    bullets.push("Compliance blocked this action — overrides governance and autopilot posture.");
  }
  if (
    params.gate.reasons.includes("region_capability_block") ||
    params.gate.reasons.includes("region_execution_blocked")
  ) {
    bullets.push("Region capability policy blocks live execution — intelligence and preview remain available.");
  }
  if (params.gate.reasons.includes("region_recommend_only")) {
    bullets.push("Region is limited to recommendations / preview for this phase.");
  }
  if (params.gate.reasons.includes("dry_run_forced")) {
    bullets.push("Run-level dry-run or policy dry-run prevented live mutations.");
  }
  if (params.gate.reasons.includes("governance_recommend_only")) {
    bullets.push("Governance posture is recommendation-only — no autonomous execution.");
  }
  if (params.gate.reasons.includes("governance_require_approval")) {
    bullets.push("Human approval is required before any live execution.");
  }
  if (params.gate.reasons.includes("config_disabled")) {
    bullets.push("Action type or governance auto-execute is disabled in configuration.");
  }
  if (params.gate.reasons.includes("risk_block")) {
    bullets.push("Trust or legal-risk gates require human review.");
  }
  if (params.gate.reasons.includes("policy_block")) {
    bullets.push("Policy engine blocked this action.");
  }
  if (params.gate.allowed) {
    bullets.push("All execution gates passed for internal-safe action types — executor outcome is recorded separately.");
  }

  const summary = params.decision.allowExecution
    ? "Execution was eligible under controlled gates (subject to safe internal action list)."
    : "Execution was not performed — conservative gates or approval requirements applied.";

  return { summary, bullets: bullets.length ? bullets : ["No additional guard notes."] };
}

export function explainControlledExecutionBatch(decisions: ControlledExecutionDecision[]): LiveExecutionExplanation[] {
  return decisions.map((decision) =>
    explainControlledExecutionDecision({
      gate: {
        allowed: decision.allowExecution,
        status: decision.status as SafeExecutionGateOutput["status"],
        reasons: decision.reasons,
        requiresApproval: decision.requiresApproval,
      },
      decision,
    }),
  );
}
