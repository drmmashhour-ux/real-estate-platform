import type {
  AMLCheck,
  AMLViolation,
  AMLEvaluation,
  AMLSeverity,
  DealAMLComplianceContext,
} from "@/lib/compliance/oaciq/aml/types";
import { OACIQ_AML_RULES } from "@/lib/compliance/oaciq/aml/rules";
import { computeAMLScore, shouldBlockTransaction } from "@/lib/compliance/oaciq/aml/scoring";

const RULE_BY_ID = new Map(OACIQ_AML_RULES.map((r) => [r.id, r]));

function ruleMessage(rule: AMLCheck): string {
  if (rule.required_action) {
    return `${rule.violation} — required: ${rule.required_action}`;
  }
  if (rule.prohibited_action) {
    return `${rule.violation} — prohibited: ${rule.prohibited_action}`;
  }
  return rule.violation;
}

function evaluateRule(rule: AMLCheck, ctx: DealAMLComplianceContext): boolean {
  switch (rule.id) {
    case "no_illegal_activity":
      return ctx.illegalActivitySuspected;
    case "identity_verification_required":
      return !ctx.identityVerified;
    case "legal_capacity_verification":
      return !ctx.legalCapacityConfirmed;
    case "trust_account_misuse":
      return ctx.trustAccountHoldsUnrelatedFunds;
    case "suspicious_transaction":
      return ctx.suspiciousPatternDetected;
    case "record_keeping_required":
      return ctx.transactionCompleted && !ctx.recordsCompleteAndAccessible;
    case "reporting_entity_obligation":
      return !ctx.reportingObligationsUpToDate;
    case "value_mismatch":
      return ctx.priceVsDeclaredValueMismatch;
    case "nominee_buyer":
      return ctx.nomineeOrHiddenBeneficiarySuspected;
    case "structured_transactions":
      return ctx.structuringPatternSuspected;
    case "abnormal_speed":
      return ctx.transactionAbnormallyFastWithoutJustification;
    case "over_financing":
      return ctx.mortgageExceedsPropertyValue;
    default:
      return false;
  }
}

const SEVERITY_RANK: Record<AMLSeverity, number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
};

export function maxTriggeredSeverity(violations: AMLViolation[]): AMLSeverity {
  if (violations.length === 0) return "low";
  let max: AMLSeverity = "low";
  for (const v of violations) {
    if (SEVERITY_RANK[v.severity] > SEVERITY_RANK[max]) max = v.severity;
  }
  return max;
}

/**
 * Deterministic AML / fraud-indicator scan. Does not replace FINTRAC reporting or legal advice.
 */
export function runAMLEngine(
  ctx: DealAMLComplianceContext,
  ruleIds?: readonly string[],
): AMLEvaluation {
  const ids = ruleIds ?? OACIQ_AML_RULES.map((r) => r.id);
  const triggered: AMLCheck[] = [];
  const violations: AMLViolation[] = [];

  for (const id of ids) {
    const rule = RULE_BY_ID.get(id);
    if (!rule) continue;
    if (evaluateRule(rule, ctx)) {
      triggered.push(rule);
      violations.push({
        rule: rule.id,
        message: ruleMessage(rule),
        severity: rule.severity,
        risk_score: rule.risk_score,
        source: "OACIQ_AML",
      });
    }
  }

  const risk_score = computeAMLScore(triggered);
  const gate = shouldBlockTransaction(risk_score);

  return {
    compliant: violations.length === 0,
    violations,
    triggered_rule_ids: violations.map((v) => v.rule),
    risk_score,
    gate,
  };
}

export function validateDealAMLCompliance(
  ctx: DealAMLComplianceContext,
  ruleIds?: readonly string[],
): AMLEvaluation {
  return runAMLEngine(ctx, ruleIds);
}

/** Merge partial POST body with relaxed defaults (unknown → compliant) for dry-runs. */
export function mergeDealAMLContextRelaxed(
  partial?: Partial<DealAMLComplianceContext>,
): DealAMLComplianceContext {
  const base: DealAMLComplianceContext = {
    illegalActivitySuspected: false,
    identityVerified: true,
    legalCapacityConfirmed: true,
    trustAccountHoldsUnrelatedFunds: false,
    suspiciousPatternDetected: false,
    transactionCompleted: false,
    recordsCompleteAndAccessible: true,
    reportingObligationsUpToDate: true,
    priceVsDeclaredValueMismatch: false,
    nomineeOrHiddenBeneficiarySuspected: false,
    structuringPatternSuspected: false,
    transactionAbnormallyFastWithoutJustification: false,
    mortgageExceedsPropertyValue: false,
  };
  return { ...base, ...partial };
}
