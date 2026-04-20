import { autonomyConfig } from "../config/autonomy.config";
import type {
  AutonomyMode,
  GovernanceDisposition,
  GovernanceResolution,
  PolicyDecision,
  PolicyDisposition,
  PolicyRuleEvaluation,
  ProposedAction,
  RiskLevel,
} from "../types/domain.types";

/** Legal-domain soft warnings do not halt autonomous eligibility — still logged via policy warnings. */
function policyHasOnlyLegalSoftWarnings(policy: PolicyDecision): boolean {
  if (policy.disposition !== "ALLOW_WITH_APPROVAL") return false;
  if (policy.violations.length > 0) return false;
  const nonPass = policy.ruleResults.filter((r: PolicyRuleEvaluation) => r.result !== "passed");
  if (nonPass.length === 0) return false;
  return nonPass.every((r) => {
    const meta =
      r.metadata && typeof r.metadata === "object" ? (r.metadata as Record<string, unknown>) : null;
    const domain = meta?.domain;
    const severity = meta?.severity;
    return (
      r.result === "warning" &&
      domain === "legal" &&
      severity !== "critical"
    );
  });
}

function dispositionForElevatedRisk(mode: AutonomyMode, risk: RiskLevel): "REQUIRE_APPROVAL" | null {
  if (mode === "SAFE_AUTOPILOT" && risk !== "LOW") {
    return "REQUIRE_APPROVAL";
  }
  if (
    mode === "FULL_AUTOPILOT_APPROVAL" &&
    (risk === "HIGH" || risk === "CRITICAL")
  ) {
    return "REQUIRE_APPROVAL";
  }
  return null;
}

/**
 * Maps autonomy mode + policy decision + action risk → operator-facing disposition.
 *
 * Dispositions: `RECOMMEND_ONLY` | `DRY_RUN` | `REQUIRE_APPROVAL` | `AUTO_EXECUTE`.
 *
 * Execution posture: when `AUTO_EXECUTE`, `allowExecution` is true only if
 * `autonomyConfig.governanceAutoExecuteEnabled` is true (default false — no live execution until enabled).
 */
export function resolveGovernance(input: {
  action: ProposedAction;
  policy: PolicyDecision;
  mode: AutonomyMode;
  dryRunRequested: boolean;
}): GovernanceResolution {
  const { action, policy, mode, dryRunRequested } = input;
  const execTypeAllowed = autonomyConfig.actionExecutionAllowed[action.type] === true;
  const mayAuthorizeExecution =
    autonomyConfig.governanceAutoExecuteEnabled && execTypeAllowed;

  const baseDryRun = (): GovernanceResolution["allowDryRun"] => true;

  if (mode === "OFF") {
    return {
      disposition: "RECOMMEND_ONLY",
      reason: "Autonomy is OFF — no autonomous execution.",
      allowExecution: false,
      allowDryRun: baseDryRun(),
    };
  }

  const legalSoftOnly = policyHasOnlyLegalSoftWarnings(policy);
  const effectiveDisposition: PolicyDisposition = legalSoftOnly ? "ALLOW" : policy.disposition;

  if (effectiveDisposition === "BLOCK") {
    return {
      disposition: "RECOMMEND_ONLY",
      reason: "Policy blocked this action.",
      allowExecution: false,
      allowDryRun: baseDryRun(),
    };
  }

  if (effectiveDisposition === "ALLOW_DRY_RUN" || dryRunRequested) {
    return {
      disposition: "DRY_RUN",
      reason: dryRunRequested
        ? "Dry-run requested for this run."
        : "Policy confines this action to dry-run.",
      allowExecution: false,
      allowDryRun: baseDryRun(),
    };
  }

  if (effectiveDisposition === "ALLOW_WITH_APPROVAL") {
    return {
      disposition: "REQUIRE_APPROVAL",
      reason: "Policy requires explicit human approval.",
      allowExecution: false,
      allowDryRun: baseDryRun(),
    };
  }

  // effectiveDisposition === "ALLOW"
  if (mode === "ASSIST") {
    return {
      disposition: "RECOMMEND_ONLY",
      reason: "ASSIST mode — recommendations only.",
      allowExecution: false,
      allowDryRun: baseDryRun(),
    };
  }

  const elevated = dispositionForElevatedRisk(mode, action.risk);
  if (elevated === "REQUIRE_APPROVAL") {
    const reason =
      mode === "SAFE_AUTOPILOT"
        ? "SAFE_AUTOPILOT permits autonomous execution only for LOW risk actions."
        : "HIGH / CRITICAL risk requires approval in full autopilot mode.";
    return {
      disposition: "REQUIRE_APPROVAL",
      reason,
      allowExecution: false,
      allowDryRun: baseDryRun(),
    };
  }

  if (!execTypeAllowed) {
    return {
      disposition: "RECOMMEND_ONLY",
      reason: `Action type ${action.type} is disabled for execution in configuration.`,
      allowExecution: false,
      allowDryRun: baseDryRun(),
    };
  }

  if (mode === "SAFE_AUTOPILOT") {
    return {
      disposition: "AUTO_EXECUTE",
      reason:
        "SAFE_AUTOPILOT — low risk, policy clear; execution authorized when governance auto-exec is enabled.",
      allowExecution: mayAuthorizeExecution,
      allowDryRun: baseDryRun(),
    };
  }

  if (mode === "FULL_AUTOPILOT_APPROVAL") {
    return {
      disposition: "AUTO_EXECUTE",
      reason:
        "FULL_AUTOPILOT_APPROVAL — LOW/MEDIUM risk with clear policy; execution authorized when governance auto-exec is enabled.",
      allowExecution: mayAuthorizeExecution,
      allowDryRun: baseDryRun(),
    };
  }

  return {
    disposition: "RECOMMEND_ONLY",
    reason: "Unhandled mode — conservative recommendation-only path.",
    allowExecution: false,
    allowDryRun: baseDryRun(),
  };
}

/** Serializable facts for Phase 4.5 timeline correlation (events are recorded from the execution engine). */
export function extractGovernanceTimelineFacts(input: {
  policy: PolicyDecision;
  governance: GovernanceResolution;
}): {
  policyDisposition: PolicyDisposition;
  governanceDisposition: GovernanceDisposition;
  blockedByPolicy: boolean;
} {
  return {
    policyDisposition: input.policy.disposition,
    governanceDisposition: input.governance.disposition,
    blockedByPolicy: input.policy.disposition === "BLOCK",
  };
}
