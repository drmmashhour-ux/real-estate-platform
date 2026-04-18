import { autonomyConfig } from "../config/autonomy.config";
import type {
  AutonomyMode,
  GovernanceResolution,
  PolicyDecision,
  ProposedAction,
  RiskLevel,
} from "../types/domain.types";

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

  if (policy.disposition === "BLOCK") {
    return {
      disposition: "RECOMMEND_ONLY",
      reason: "Policy blocked this action.",
      allowExecution: false,
      allowDryRun: baseDryRun(),
    };
  }

  if (policy.disposition === "ALLOW_DRY_RUN" || dryRunRequested) {
    return {
      disposition: "DRY_RUN",
      reason: dryRunRequested
        ? "Dry-run requested for this run."
        : "Policy confines this action to dry-run.",
      allowExecution: false,
      allowDryRun: baseDryRun(),
    };
  }

  if (policy.disposition === "ALLOW_WITH_APPROVAL") {
    return {
      disposition: "REQUIRE_APPROVAL",
      reason: "Policy requires explicit human approval.",
      allowExecution: false,
      allowDryRun: baseDryRun(),
    };
  }

  // policy.disposition === "ALLOW"
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
