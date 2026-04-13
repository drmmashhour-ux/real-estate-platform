import type { RuleEngineResult } from "../types";

export function runCustomClauseRules(fieldValues: Record<string, unknown>): RuleEngineResult {
  const alerts: RuleEngineResult["alerts"] = [];
  const text = fieldValues.custom_clause_notes;
  if (typeof text === "string" && text.length > 20) {
    const lower = text.toLowerCase();
    if (lower.includes("waiver") && lower.includes("all liability")) {
      alerts.push({
        severity: "warning",
        alertType: "clause_risk",
        title: "Possible compliance issue — custom clause wording",
        body: "This custom clause may need independent review. AI does not validate legal effect.",
        sourceType: "rule_engine",
        sourceRef: "custom_clause_rules",
      });
    }
  }
  return { alerts, details: { customClauseRules: true } };
}
