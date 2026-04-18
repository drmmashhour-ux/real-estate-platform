import {
  POLICY_CRITICAL_SIGNAL_THRESHOLD,
  POLICY_REPEATED_CROSS_ENTITY_THRESHOLD,
} from "@/modules/legal/legal-intelligence.constants";
import type { PolicyRuleEvaluation } from "../../types/domain.types";
import type { PolicyContext } from "../policy-context";

const DOMAIN = "legal_intelligence" as const;

function n(ctx: PolicyContext, t: string): number {
  const m = ctx.legalIntelligenceSummary?.countsBySignalType;
  if (!m) return 0;
  return (m as Record<string, number | undefined>)[t] ?? 0;
}

export const legalIntelResubmissionRuleCode = "legal_intelligence_resubmission_loop";

/** Elevated resubmission-pattern counts — advisory warning; escalation hint only. */
export function evaluateLegalIntelResubmissionLoop(ctx: PolicyContext): PolicyRuleEvaluation {
  const summary = ctx.legalIntelligenceSummary;
  if (!summary || summary.totalSignals === 0) {
    return { ruleCode: legalIntelResubmissionRuleCode, result: "passed" };
  }
  const cnt = n(ctx, "suspicious_resubmission_pattern");
  if (cnt < 2) {
    return { ruleCode: legalIntelResubmissionRuleCode, result: "passed" };
  }
  return {
    ruleCode: legalIntelResubmissionRuleCode,
    result: "warning",
    dispositionHint: "ALLOW_WITH_APPROVAL",
    reason:
      "Legal intelligence: repeated resubmission-pattern signal in scope — require human review before auto-execution (advisory).",
    metadata: {
      domain: DOMAIN,
      severity: "warning" as const,
      message: "Resubmission loop pattern",
      recommendedActionType: "HUMAN_REVIEW",
      blocking: false,
      count: cnt,
    },
  };
}

export const legalIntelDuplicateDocRuleCode = "legal_intelligence_duplicate_document";

export function evaluateLegalIntelDuplicateDocument(ctx: PolicyContext): PolicyRuleEvaluation {
  if (!ctx.legalIntelligenceSummary) {
    return { ruleCode: legalIntelDuplicateDocRuleCode, result: "passed" };
  }
  const duplicate = n(ctx, "duplicate_document");
  if (duplicate < POLICY_CRITICAL_SIGNAL_THRESHOLD) {
    return { ruleCode: legalIntelDuplicateDocRuleCode, result: "passed" };
  }
  return {
    ruleCode: legalIntelDuplicateDocRuleCode,
    result: "blocked",
    dispositionHint: "BLOCK",
    reason:
      "Legal intelligence: critical duplicate-document pattern in scope — block automated execution for risk containment (not a fraud determination).",
    metadata: {
      domain: DOMAIN,
      severity: "critical" as const,
      message: "Duplicate document pattern threshold",
      recommendedActionType: "MANUAL_VERIFICATION",
      blocking: true,
      duplicateSignalCount: duplicate,
    },
  };
}

export const legalIntelBurstRuleCode = "legal_intelligence_submission_burst";

export function evaluateLegalIntelSubmissionBurst(ctx: PolicyContext): PolicyRuleEvaluation {
  const burst = n(ctx, "high_risk_submission_burst");
  if (burst < 1) {
    return { ruleCode: legalIntelBurstRuleCode, result: "passed" };
  }
  return {
    ruleCode: legalIntelBurstRuleCode,
    result: "warning",
    dispositionHint: "ALLOW_WITH_APPROVAL",
    reason:
      "Legal intelligence: submission burst signal — prioritize reviewer allocation; auto-execution requires approval.",
    metadata: {
      domain: DOMAIN,
      severity: "warning" as const,
      message: "Submission burst",
      recommendedActionType: "CAPACITY_CHECK",
      blocking: false,
      burstSignalCount: burst,
    },
  };
}

export const legalIntelCrossEntityRuleCode = "legal_intelligence_cross_entity";

export function evaluateLegalIntelCrossEntityConflict(ctx: PolicyContext): PolicyRuleEvaluation {
  const cross = n(ctx, "cross_entity_conflict");
  if (cross < POLICY_REPEATED_CROSS_ENTITY_THRESHOLD) {
    return { ruleCode: legalIntelCrossEntityRuleCode, result: "passed" };
  }
  return {
    ruleCode: legalIntelCrossEntityRuleCode,
    result: "warning",
    dispositionHint: "ALLOW_WITH_APPROVAL",
    reason:
      "Legal intelligence: repeated cross-entity metadata overlap — verify listing association before autonomous changes.",
    metadata: {
      domain: DOMAIN,
      severity: "warning" as const,
      message: "Cross-entity overlap",
      recommendedActionType: "COORDINATED_REVIEW",
      blocking: false,
      crossEntitySignalCount: cross,
    },
  };
}

export const legalIntelBacklogRuleCode = "legal_intelligence_review_backlog";

export function evaluateLegalIntelReviewBacklog(ctx: PolicyContext): PolicyRuleEvaluation {
  const delay = n(ctx, "review_delay_risk");
  const missing = n(ctx, "missing_required_cluster");
  if (delay < 2 || missing < 1) {
    return { ruleCode: legalIntelBacklogRuleCode, result: "passed" };
  }
  return {
    ruleCode: legalIntelBacklogRuleCode,
    result: "blocked",
    dispositionHint: "BLOCK",
    reason:
      "Legal intelligence: review backlog risk on critical-path requirements — pause automated marketplace execution until staffing catch-up.",
    metadata: {
      domain: DOMAIN,
      severity: "critical" as const,
      message: "Backlog + missing cluster",
      recommendedActionType: "OPERATIONS_REVIEW",
      blocking: true,
      delaySignals: delay,
      missingClusterSignals: missing,
    },
  };
}
