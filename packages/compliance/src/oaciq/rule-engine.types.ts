/**
 * Typed rule bundles for OACIQ-aligned platform enforcement.
 * Populate `OaciqComplianceSection.ruleEngineJson` / `aiBehaviorJson` from official guideline text (counsel-reviewed).
 */

export type OaciqConditionalRule = {
  id: string;
  when: { field: string; equals: unknown };
  /** Context keys that must be truthy when `when` matches. */
  thenRequire: string[];
};

/** Mirrors `rule_engine.{{section_key}}` from the compliance playbook. */
export type OaciqRuleEngineBundle = {
  requiredActions: string[];
  forbiddenActions: string[];
  conditionalChecks: OaciqConditionalRule[];
};

export type OaciqAiBehaviorBundle = {
  AI_CHECKLIST: string[];
  AI_WARNINGS: string[];
  AI_BLOCKS: string[];
};

export type OaciqComplianceRiskLevel = "LOW" | "MEDIUM" | "HIGH";

export type OaciqEvaluationOutcome = "pass" | "warn" | "block";

export type OaciqEvaluationResult = {
  outcome: OaciqEvaluationOutcome;
  complianceRiskScore: OaciqComplianceRiskLevel;
  blockedReasons: string[];
  warnings: string[];
  triggeredConditionalRules: string[];
};
