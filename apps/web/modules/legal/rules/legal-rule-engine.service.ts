/**
 * Policy-style rules from validation outcomes — business impacts, no duplicate field checks.
 */

import type {
  LegalRecordType,
  LegalRuleResult,
  LegalValidationResult,
} from "../records/legal-record.types";

export type LegalRuleEngineInput = {
  recordType: LegalRecordType;
  parsedData: Record<string, unknown>;
  validation: LegalValidationResult;
};

export function evaluateLegalRules(input: LegalRuleEngineInput): LegalRuleResult[] {
  const rules: LegalRuleResult[] = [];
  try {
    const { recordType, validation } = input;

    if (!validation.isValid) {
      if (validation.missingFields.length > 0) {
        rules.push({
          ruleId: `completeness.${recordType}.missing_fields`,
          severity: "warning",
          message: `Required structured fields are not present for ${recordType}.`,
          impact: "requires_review",
        });
      }
      if (validation.inconsistentFields.length > 0) {
        rules.push({
          ruleId: `consistency.${recordType}.cross_field`,
          severity: "warning",
          message: `Cross-field checks did not pass for ${recordType}.`,
          impact: "requires_review",
        });
      }
    }

    if (recordType === "seller_declaration" && validation.missingFields.includes("hasKnownDefects")) {
      rules.push({
        ruleId: "readiness.seller_declaration.known_defects_unknown",
        severity: "critical",
        message: "Seller declaration does not state known defects status — readiness is incomplete.",
        impact: "readiness_degraded",
      });
    }

    if (recordType === "proof_of_ownership" && !validation.isValid) {
      rules.push({
        ruleId: "compliance.ownership.evidence_incomplete",
        severity: "critical",
        message: "Proof of ownership record is incomplete for listing compliance review.",
        impact: "blocks_listing",
      });
    }

    if (validation.warnings.length > 0) {
      rules.push({
        ruleId: `compliance.${recordType}.soft_warnings`,
        severity: "info",
        message: "Non-blocking validation notices are present — review recommended.",
        impact: "advisory_only",
      });
    }

    if (rules.length === 0) {
      rules.push({
        ruleId: `readiness.${recordType}.ok`,
        severity: "info",
        message: "Structured checks for this record type passed at the configured rule tier.",
        impact: "advisory_only",
      });
    }

    return rules.sort((a, b) => a.ruleId.localeCompare(b.ruleId));
  } catch {
    return [
      {
        ruleId: "engine.fallback",
        severity: "warning",
        message: "Rule evaluation returned a safe minimal result.",
        impact: "requires_review",
      },
    ];
  }
}
