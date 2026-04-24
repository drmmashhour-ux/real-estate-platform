import type { ComplianceCaseContext, ComplianceRule, ComplianceRuleResult } from "@/modules/compliance/core/rule-types";

function r(
  id: string,
  passed: boolean,
  severity: ComplianceRuleResult["severity"],
  code: string,
  title: string,
  message: string,
  blocking?: boolean,
  requiredActions?: string[],
): ComplianceRuleResult {
  return { ruleId: id, passed, severity, code, title, message, blocking, requiredActions };
}

const THRESHOLD_HIGH = 60;

export const amlFraudRules: ComplianceRule[] = [
  {
    id: "identity_verification_completed",
    category: "aml",
    evaluate(ctx) {
      if (!ctx.identityVerification?.required) return null;
      const ok = ctx.identityVerification.completed;
      return r(
        "identity_verification_completed",
        ok,
        ok ? "low" : "critical",
        "AML_ID_DONE",
        "Identity verification completed",
        ok ? "Identity verification completed." : "Complete identity verification before proceeding.",
        !ok,
      );
    },
  },
  {
    id: "legal_capacity_verified",
    category: "aml",
    evaluate(ctx) {
      if (!ctx.metadata?.legalCapacityCheckRequired) return null;
      const ok = ctx.metadata.legalCapacityVerified === true;
      return r(
        "legal_capacity_verified",
        ok,
        ok ? "low" : "high",
        "AML_CAPACITY",
        "Legal capacity",
        ok ? "Legal capacity verification recorded." : "Verify legal capacity where transaction risk warrants.",
        !ok,
      );
    },
  },
  {
    id: "aml_indicator_score_high",
    category: "aml",
    evaluate(ctx) {
      if (!ctx.aml) return null;
      const score = ctx.aml.indicatorScore ?? ctx.aml.suspiciousIndicators.length * 15;
      const high = score >= THRESHOLD_HIGH || ctx.aml.highRisk;
      return r(
        "aml_indicator_score_high",
        !high,
        high ? "critical" : "low",
        "AML_SCORE",
        "AML indicator score",
        high
          ? `AML indicator score elevated (${score}). Manual compliance review required — no silent approval.`
          : "AML indicator score within monitored range.",
        high,
        high ? ["AML review task", "Document rationale", "FINTRAC readiness check"] : undefined,
      );
    },
  },
  {
    id: "large_cash_transaction_detected",
    category: "aml",
    evaluate(ctx) {
      if (!ctx.aml?.largeCashTransaction) return null;
      const reviewed = ctx.metadata?.largeCashReviewCompleted === true;
      return r(
        "large_cash_transaction_detected",
        reviewed,
        reviewed ? "low" : "critical",
        "AML_LCT",
        "Large cash transaction",
        reviewed
          ? "Large cash path reviewed by compliance."
          : "Large cash transaction — block auto progression until compliance review.",
        !reviewed,
      );
    },
  },
  {
    id: "suspicious_transaction_review_required",
    category: "aml",
    evaluate(ctx) {
      if (!ctx.aml?.reportingRequired) return null;
      const ok = ctx.metadata?.strReadinessReviewed === true;
      return r(
        "suspicious_transaction_review_required",
        ok,
        ok ? "low" : "critical",
        "AML_STR",
        "Suspicious reporting readiness",
        ok ? "Suspicious transaction escalation path reviewed." : "Record supervisory review before proceeding.",
        !ok,
      );
    },
  },
  {
    id: "trust_account_misuse_block",
    category: "aml",
    evaluate(ctx) {
      if (ctx.metadata?.trustMisuseIndicator !== true) return null;
      return r(
        "trust_account_misuse_block",
        false,
        "critical",
        "AML_TRUST_MISUSE",
        "Trust misuse indicator",
        "Trust account misuse indicator — hard stop pending broker / compliance decision.",
        true,
      );
    },
  },
  {
    id: "fintrac_record_pack_required",
    category: "aml",
    evaluate(ctx) {
      if (!ctx.aml?.recordKeepingComplete && !ctx.aml?.highRisk) return null;
      const ok = ctx.aml.recordKeepingComplete;
      return r(
        "fintrac_record_pack_required",
        ok,
        ok ? "low" : "high",
        "AML_FINTRAC_PACK",
        "FINTRAC record completeness",
        ok ? "Record-keeping pack complete for AML path." : "Assemble FINTRAC-aligned record pack before release.",
        false,
      );
    },
  },
];
