/**
 * Maps unified governance outcomes into legacy `GovernanceResolution` for the controlled-execution gate.
 */
import type { GovernanceResolution } from "../types/domain.types";
import type { UnifiedGovernanceResult } from "./unified-governance.types";

export function unifiedResultToGovernanceResolution(unified: UnifiedGovernanceResult): GovernanceResolution {
  const allowDryRun = true;
  switch (unified.disposition) {
    case "AUTO_EXECUTE":
      return {
        disposition: "AUTO_EXECUTE",
        reason: unified.explainability.summary,
        allowExecution: unified.allowExecution,
        allowDryRun,
      };
    case "REQUIRE_APPROVAL":
      return {
        disposition: "REQUIRE_APPROVAL",
        reason: unified.explainability.summary,
        allowExecution: false,
        allowDryRun,
      };
    case "DRY_RUN":
      return {
        disposition: "DRY_RUN",
        reason: unified.explainability.summary,
        allowExecution: false,
        allowDryRun,
      };
    case "RECOMMEND_ONLY":
      return {
        disposition: "RECOMMEND_ONLY",
        reason: unified.explainability.summary,
        allowExecution: false,
        allowDryRun,
      };
    case "REJECTED":
      return {
        disposition: "RECOMMEND_ONLY",
        reason: unified.explainability.summary,
        allowExecution: false,
        allowDryRun,
      };
    default:
      return {
        disposition: "RECOMMEND_ONLY",
        reason: unified.explainability.summary,
        allowExecution: false,
        allowDryRun,
      };
  }
}

/**
 * Merges autonomy-mode resolver output with unified governance — unified wins on risk / region blocks.
 */
export function mergeGovernanceWithUnified(
  legacy: GovernanceResolution,
  unified: UnifiedGovernanceResult,
): GovernanceResolution {
  const allowDryRun = legacy.allowDryRun;

  if (unified.blocked || unified.disposition === "REJECTED") {
    return {
      disposition: "RECOMMEND_ONLY",
      reason: `Unified governance: ${unified.disposition}. ${unified.explainability.summary}`,
      allowExecution: false,
      allowDryRun,
    };
  }

  const ug = unifiedResultToGovernanceResolution(unified);

  if (legacy.disposition === "RECOMMEND_ONLY" && legacy.reason.includes("Autonomy is OFF")) {
    return legacy;
  }

  if (legacy.disposition === "RECOMMEND_ONLY" && legacy.reason.includes("ASSIST mode")) {
    if (ug.disposition === "REQUIRE_APPROVAL" || unified.disposition === "REQUIRE_APPROVAL") {
      return {
        disposition: "REQUIRE_APPROVAL",
        reason: ug.reason,
        allowExecution: false,
        allowDryRun,
      };
    }
    return {
      ...legacy,
      reason: `${legacy.reason} | Unified posture: ${unified.explainability.summary}`,
    };
  }

  if (legacy.disposition === "DRY_RUN" || unified.disposition === "DRY_RUN") {
    return {
      disposition: "DRY_RUN",
      reason: `${legacy.reason} | ${ug.reason}`,
      allowExecution: false,
      allowDryRun,
    };
  }

  if (ug.disposition === "REQUIRE_APPROVAL" || unified.disposition === "REQUIRE_APPROVAL") {
    return {
      disposition: "REQUIRE_APPROVAL",
      reason: ug.reason,
      allowExecution: false,
      allowDryRun,
    };
  }

  if (ug.disposition === "AUTO_EXECUTE") {
    return {
      disposition: "AUTO_EXECUTE",
      reason: `${legacy.reason} | ${ug.reason}`,
      allowExecution: legacy.allowExecution && ug.allowExecution,
      allowDryRun,
    };
  }

  return {
    disposition: ug.disposition,
    reason: `${legacy.reason} | ${ug.reason}`,
    allowExecution: ug.allowExecution && legacy.allowExecution,
    allowDryRun,
  };
}
