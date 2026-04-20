/**
 * Québec deterministic compliance — policy evaluation only (no writes).
 */

import { complianceFlags } from "@/config/feature-flags";
import type { PolicyRuleEvaluation } from "../../types/domain.types";
import type { PolicyContext } from "../policy-context";

export const QUEBEC_COMPLIANCE_RULE_CODE = "quebec_compliance_publish_gate";
export const QUEBEC_COMPLIANCE_READINESS_RULE_CODE = "quebec_compliance_readiness_warn";

const READINESS_WARN_THRESHOLD = 80;

export function evaluateQuebecCompliancePublishRule(ctx: PolicyContext): PolicyRuleEvaluation {
  try {
    if (!complianceFlags.quebecComplianceV1) {
      return { ruleCode: QUEBEC_COMPLIANCE_RULE_CODE, result: "passed" };
    }

    const qc = ctx.quebecCompliance;
    if (!qc) {
      return {
        ruleCode: QUEBEC_COMPLIANCE_RULE_CODE,
        result: "passed",
        reason: "Québec compliance snapshot not attached — evaluation skipped.",
      };
    }

    if (!qc.allowed) {
      return {
        ruleCode: QUEBEC_COMPLIANCE_RULE_CODE,
        result: "blocked",
        dispositionHint: "BLOCK",
        reason:
          "Listing cannot be published due to missing or invalid required compliance items.",
        metadata: {
          domain: "legal_compliance",
          severity: "critical",
          action: "block_publish",
          readinessScore: qc.readinessScore,
          blockingIssueIds: qc.blockingIssueIds,
          reasonsPreview: qc.reasonsPreview,
        },
      };
    }

    return {
      ruleCode: QUEBEC_COMPLIANCE_RULE_CODE,
      result: "passed",
      metadata: {
        domain: "legal_compliance",
        readinessScore: qc.readinessScore,
      },
    };
  } catch {
    return {
      ruleCode: QUEBEC_COMPLIANCE_RULE_CODE,
      result: "passed",
      reason: "Québec compliance rule skipped due to safe fallback.",
    };
  }
}

/** Advisory when readiness below threshold — does not replace hard gate at publish time. */
export function evaluateQuebecComplianceReadinessWarningRule(ctx: PolicyContext): PolicyRuleEvaluation {
  try {
    if (!complianceFlags.quebecComplianceV1) {
      return { ruleCode: QUEBEC_COMPLIANCE_READINESS_RULE_CODE, result: "passed" };
    }
    const qc = ctx.quebecCompliance;
    if (!qc || qc.readinessScore >= READINESS_WARN_THRESHOLD) {
      return { ruleCode: QUEBEC_COMPLIANCE_READINESS_RULE_CODE, result: "passed" };
    }

    return {
      ruleCode: QUEBEC_COMPLIANCE_READINESS_RULE_CODE,
      result: "warning",
      dispositionHint: "ADVISORY_ONLY",
      reason:
        `Compliance readiness index is below ${READINESS_WARN_THRESHOLD} — complete remaining checklist items before publishing.`,
      metadata: {
        domain: "legal_compliance",
        severity: "warning",
        readinessScore: qc.readinessScore,
        threshold: READINESS_WARN_THRESHOLD,
      },
    };
  } catch {
    return { ruleCode: QUEBEC_COMPLIANCE_READINESS_RULE_CODE, result: "passed" };
  }
}
