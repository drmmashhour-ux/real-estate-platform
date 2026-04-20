/**
 * Trust-domain policy rules — operational signals only (no legal conclusions).
 */

import { trustFlags } from "@/config/feature-flags";
import { autonomyConfig } from "../../config/autonomy.config";
import type { PolicyRuleEvaluation } from "../../types/domain.types";
import type { PolicyContext } from "../policy-context";

export const TRUST_POLICY_DOMAIN = "trust" as const;

export const trustLowCriticalGuardRuleCode = "trust_low_critical_guard";

/** Low trust + critical compliance intelligence → block high-risk autonomous marketplace actions. */
export function evaluateTrustLowCriticalGuard(ctx: PolicyContext): PolicyRuleEvaluation {
  const ts = ctx.trustScore;
  const crit = ctx.legalIntelligenceSummary?.countsBySeverity?.critical ?? 0;
  if (!ts || crit < 1) {
    return { ruleCode: trustLowCriticalGuardRuleCode, result: "passed" };
  }
  if (ts.level !== "low" && ts.score > 34) {
    return { ruleCode: trustLowCriticalGuardRuleCode, result: "passed" };
  }

  const risky = autonomyConfig.highRiskActionTypes.includes(
    ctx.action.type as (typeof autonomyConfig.highRiskActionTypes)[number],
  );
  if (!risky) {
    return { ruleCode: trustLowCriticalGuardRuleCode, result: "passed" };
  }

  return {
    ruleCode: trustLowCriticalGuardRuleCode,
    result: "blocked",
    dispositionHint: "BLOCK",
    reason:
      "Trust score is low while critical compliance intelligence signals are present — autonomous promotion / pricing actions are restricted until signals are addressed.",
    metadata: {
      domain: TRUST_POLICY_DOMAIN,
      severity: "critical" as const,
      blocking: true,
      trustLevel: ts.level,
      criticalSignalCount: crit,
    },
  };
}

export const trustIntelWarningRuleCode = "trust_intel_warning_surge";

/** Many warning-tier intelligence signals → advisory policy warning (still explainable). */
export function evaluateTrustIntelWarningSurge(ctx: PolicyContext): PolicyRuleEvaluation {
  if (!trustFlags.trustScoringV1) {
    return { ruleCode: trustIntelWarningRuleCode, result: "passed" };
  }
  const warn = ctx.legalIntelligenceSummary?.countsBySeverity?.warning ?? 0;
  const warnTotal = ctx.legalIntelligenceSummary?.totalSignals ?? 0;
  if (warn < 6 && warnTotal < 12) {
    return { ruleCode: trustIntelWarningRuleCode, result: "passed" };
  }
  return {
    ruleCode: trustIntelWarningRuleCode,
    result: "warning",
    dispositionHint: "ALLOW_WITH_APPROVAL",
    reason:
      "Elevated warning-tier compliance intelligence volume — prioritize human review before scaling autonomous marketplace actions.",
    metadata: {
      domain: TRUST_POLICY_DOMAIN,
      severity: "warning" as const,
      blocking: false,
      warningSignalCount: warn,
    },
  };
}
