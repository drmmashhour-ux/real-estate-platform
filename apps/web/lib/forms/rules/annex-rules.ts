import type { LegalFormSchemaDocument } from "../types";
import type { RuleEngineResult } from "../types";

export function runAnnexRules(
  schema: LegalFormSchemaDocument,
  fieldValues: Record<string, unknown>
): RuleEngineResult {
  const alerts: RuleEngineResult["alerts"] = [];
  const fin = fieldValues.financing_condition === true || fieldValues.financing_condition === "true";
  const annexFin = fieldValues.annex_financing_attached;
  if (fin && !annexFin) {
    alerts.push({
      severity: "warning",
      alertType: "annex_missing",
      title: "Annex likely required",
      body: "Financing condition is selected. Attach or reference the financing annex when applicable.",
      sourceType: "rule_engine",
      sourceRef: "annex_rules",
    });
  }
  void schema;
  return { alerts, details: { annexRules: true } };
}
