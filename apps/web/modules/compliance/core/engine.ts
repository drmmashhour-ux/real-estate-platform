import { computeComplianceDecision, type ComplianceDecision } from "@/modules/compliance/core/decision";
import type {
  ComplianceCaseContext,
  ComplianceRule,
  ComplianceRuleCategory,
  ComplianceRuleResult,
} from "@/modules/compliance/core/rule-types";
import { getAllRulesIncludingDynamic } from "@/modules/compliance/core/registry";

export type ComplianceEvaluationReport = {
  caseId: string;
  results: ComplianceRuleResult[];
  byCategory: Record<ComplianceRuleCategory, ComplianceRuleResult[]>;
  decision: ComplianceDecision;
  evaluatedAt: string;
};

function emptyByCategory(): Record<ComplianceRuleCategory, ComplianceRuleResult[]> {
  return {
    selection: [],
    representation: [],
    advertising: [],
    verification: [],
    aml: [],
    records: [],
    trust: [],
    tax: [],
    supervision: [],
    licence: [],
  };
}

export function evaluateRule(rule: ComplianceRule, ctx: ComplianceCaseContext): ComplianceRuleResult | null {
  return rule.evaluate(ctx);
}

/**
 * Deterministic evaluation — all active rules; grouped by category; overall decision.
 * Does not persist audit (caller uses `compliance-evaluator.service`).
 */
export function runComplianceEngine(
  ctx: ComplianceCaseContext,
  rules: ComplianceRule[] = getAllRulesIncludingDynamic(),
): ComplianceEvaluationReport {
  const results: ComplianceRuleResult[] = [];
  const byCategory = emptyByCategory();

  for (const rule of rules) {
    const r = evaluateRule(rule, ctx);
    if (!r) continue;
    results.push(r);
    byCategory[rule.category].push(r);
  }

  const failed = results.filter((x) => !x.passed);
  const decision = computeComplianceDecision(failed);

  return {
    caseId: ctx.caseId,
    results,
    byCategory,
    decision,
    evaluatedAt: new Date().toISOString(),
  };
}

export function isProgressionBlocked(report: ComplianceEvaluationReport): boolean {
  return report.decision.status === "blocked";
}
