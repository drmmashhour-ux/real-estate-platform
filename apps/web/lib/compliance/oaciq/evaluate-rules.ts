import type {
  OaciqComplianceRiskLevel,
  OaciqEvaluationOutcome,
  OaciqEvaluationResult,
  OaciqRuleEngineBundle,
} from "@/lib/compliance/oaciq/rule-engine.types";

function ctxValue(ctx: Record<string, unknown>, field: string): unknown {
  return ctx[field];
}

function isTruthyRequirement(v: unknown): boolean {
  return v === true;
}

/**
 * Deterministic evaluation — no AI. Context keys are supplied by workflow steps (forms, attestations, flags).
 */
export function evaluateOaciqRuleEngine(
  engine: OaciqRuleEngineBundle,
  context: Record<string, unknown>,
  defaultRisk: OaciqComplianceRiskLevel = "MEDIUM",
): OaciqEvaluationResult {
  const blockedReasons: string[] = [];
  const warnings: string[] = [];
  const triggeredConditionalRules: string[] = [];

  for (const key of engine.requiredActions) {
    if (!isTruthyRequirement(ctxValue(context, key))) {
      blockedReasons.push(`REQUIRED_NOT_MET:${key}`);
    }
  }

  for (const key of engine.forbiddenActions) {
    if (isTruthyRequirement(ctxValue(context, key))) {
      blockedReasons.push(`FORBIDDEN_TRIGGERED:${key}`);
    }
  }

  for (const rule of engine.conditionalChecks) {
    const actual = ctxValue(context, rule.when.field);
    const matches = actual === rule.when.equals;
    if (!matches) continue;
    triggeredConditionalRules.push(rule.id);
    for (const req of rule.thenRequire) {
      if (!isTruthyRequirement(ctxValue(context, req))) {
        blockedReasons.push(`CONDITIONAL_REQUIRED_NOT_MET:${rule.id}:${req}`);
      }
    }
  }

  let outcome: OaciqEvaluationOutcome = "pass";
  if (blockedReasons.length > 0) {
    outcome = "block";
  } else if (triggeredConditionalRules.length > 0 || defaultRisk === "HIGH") {
    outcome = "warn";
  }

  let complianceRiskScore: OaciqComplianceRiskLevel = defaultRisk;
  if (blockedReasons.length > 0) {
    complianceRiskScore = "HIGH";
  } else if (outcome === "warn" && defaultRisk === "LOW") {
    complianceRiskScore = "MEDIUM";
  }

  if (outcome === "warn" && blockedReasons.length === 0) {
    warnings.push("CONDITIONAL_OR_RISK_REVIEW: Human broker review required before client-facing action.");
  }

  return {
    outcome,
    complianceRiskScore,
    blockedReasons,
    warnings,
    triggeredConditionalRules,
  };
}
