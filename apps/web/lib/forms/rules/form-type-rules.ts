import type { LegalFormSchemaDocument, RuleEngineResult } from "../types";

export function runFormTypeRules(
  schema: LegalFormSchemaDocument,
  fieldValues: Record<string, unknown>
): RuleEngineResult {
  const alerts: RuleEngineResult["alerts"] = [];
  const tx = fieldValues.transaction_type;
  if (schema.transactionTypes?.length && tx && typeof tx === "string") {
    if (!schema.transactionTypes.includes(tx)) {
      alerts.push({
        severity: "blocking",
        alertType: "wrong_form",
        title: "Possible compliance issue — transaction type mismatch",
        body: `Selected transaction type "${tx}" is not listed for this template. Choose a supported type or switch template.`,
        sourceType: "rule_engine",
        sourceRef: "form_type_rules",
      });
    }
  }
  return { alerts, details: { formTypeRules: true } };
}
