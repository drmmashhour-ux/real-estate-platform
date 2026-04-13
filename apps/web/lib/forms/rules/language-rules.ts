import type { LegalFormSchemaDocument } from "../types";
import type { RuleEngineResult } from "../types";

export function runLanguageRules(
  schema: LegalFormSchemaDocument,
  draftLanguage: string,
  fieldValues: Record<string, unknown>
): RuleEngineResult {
  const alerts: RuleEngineResult["alerts"] = [];
  const declared = fieldValues.declared_language;
  if (typeof declared === "string" && declared && declared !== draftLanguage) {
    alerts.push({
      severity: "warning",
      alertType: "language_issue",
      title: "Language consistency — review required",
      body: `Draft language is "${draftLanguage}" but a field declares "${declared}". Align versions before export unless parties agreed otherwise.`,
      sourceType: "rule_engine",
      sourceRef: "language_rules",
    });
  }
  void schema;
  return { alerts, details: { languageRules: true } };
}
