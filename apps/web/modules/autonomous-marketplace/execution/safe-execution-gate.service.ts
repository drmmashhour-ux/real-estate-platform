import type { GovernanceResolution, PolicyDecision } from "../types/domain.types";
import type {
  ComplianceGateSnapshot,
  ControlledExecutionReason,
  LegalRiskSnapshot,
  TrustRiskSnapshot,
} from "./controlled-execution.types";

const LEGAL_APPROVAL_THRESHOLD = 85;

export type SafeExecutionGateInput = {
  policy: PolicyDecision;
  governance: GovernanceResolution;
  compliance: ComplianceGateSnapshot;
  legalRisk: LegalRiskSnapshot;
  trust?: TrustRiskSnapshot;
  runDryRun: boolean;
  actionTypeEnabledInConfig: boolean;
};

export type SafeExecutionGateOutput = {
  allowed: boolean;
  status: import("./controlled-execution.types").ControlledExecutionStatus;
  reasons: ControlledExecutionReason[];
  requiresApproval: boolean;
};

function hasTrustBlock(tags: readonly string[] | undefined): boolean {
  if (!tags?.length) return false;
  return tags.some((t) => t === "EXECUTION_BLOCKED" || t === "TRUST_FREEZE");
}

/**
 * Compliance and dry-run override everything. Deterministic; never throws.
 */
export function evaluateSafeExecutionGate(input: SafeExecutionGateInput): SafeExecutionGateOutput {
  const reasons: ControlledExecutionReason[] = [];

  if (input.compliance.blocked) {
    reasons.push("compliance_block");
    return { allowed: false, status: "blocked", reasons, requiresApproval: false };
  }

  if (input.runDryRun) {
    reasons.push("dry_run_forced");
    return { allowed: false, status: "dry_run", reasons, requiresApproval: false };
  }

  if (input.policy.disposition === "BLOCK") {
    reasons.push("policy_block");
    return { allowed: false, status: "blocked", reasons, requiresApproval: false };
  }

  if (!input.actionTypeEnabledInConfig) {
    reasons.push("config_disabled");
    return { allowed: false, status: "skipped", reasons, requiresApproval: false };
  }

  if (hasTrustBlock(input.trust?.tags)) {
    reasons.push("risk_block");
    return { allowed: false, status: "blocked", reasons, requiresApproval: false };
  }

  if (input.legalRisk.score >= LEGAL_APPROVAL_THRESHOLD) {
    reasons.push("risk_block");
    return {
      allowed: false,
      status: "pending_approval",
      reasons,
      requiresApproval: true,
    };
  }

  if (input.governance.disposition === "RECOMMEND_ONLY") {
    reasons.push("governance_recommend_only");
    return { allowed: false, status: "skipped", reasons, requiresApproval: false };
  }

  if (input.policy.disposition === "ALLOW_DRY_RUN") {
    reasons.push("dry_run_forced");
    return { allowed: false, status: "dry_run", reasons, requiresApproval: false };
  }

  if (input.governance.disposition === "DRY_RUN") {
    reasons.push("dry_run_forced");
    return { allowed: false, status: "dry_run", reasons, requiresApproval: false };
  }

  if (
    input.policy.disposition === "ALLOW_WITH_APPROVAL" ||
    input.governance.disposition === "REQUIRE_APPROVAL"
  ) {
    reasons.push("governance_require_approval");
    return {
      allowed: false,
      status: "pending_approval",
      reasons,
      requiresApproval: true,
    };
  }

  if (input.governance.disposition === "AUTO_EXECUTE" && !input.governance.allowExecution) {
    reasons.push("config_disabled");
    return { allowed: false, status: "skipped", reasons, requiresApproval: false };
  }

  if (input.governance.disposition !== "AUTO_EXECUTE") {
    reasons.push("governance_recommend_only");
    return { allowed: false, status: "skipped", reasons, requiresApproval: false };
  }

  if (input.policy.disposition !== "ALLOW") {
    reasons.push("policy_block");
    return { allowed: false, status: "blocked", reasons, requiresApproval: false };
  }

  reasons.push("execution_success");
  return {
    allowed: true,
    status: "not_started",
    reasons,
    requiresApproval: false,
  };
}

export type ActionExecutionEligibilityInput = SafeExecutionGateInput;

export function evaluateActionExecutionEligibility(
  input: ActionExecutionEligibilityInput,
): SafeExecutionGateOutput {
  return evaluateSafeExecutionGate(input);
}
