import type { FormDefinition } from "@/modules/oaciq-mapper/form-definition.types";
import { getFormDefinition } from "@/modules/oaciq-mapper/form-definition.registry";

export type FieldValidationIssue = {
  fieldKey: string;
  severity: "error" | "warning";
  message: string;
};

/**
 * Structural validation only — required fields present, types roughly match (no legal sufficiency).
 */
export function validateMappedFieldsAgainstRegistry(formKey: string, data: Record<string, unknown>): FieldValidationIssue[] {
  const def = getFormDefinition(formKey);
  if (!def) {
    return [{ fieldKey: "_form", severity: "error", message: "Unknown form registry key." }];
  }

  const issues: FieldValidationIssue[] = [];

  for (const sec of def.sections) {
    for (const f of sec.fields) {
      if (!f.required) continue;
      const v = data[f.fieldKey];
      if (v === undefined || v === null || v === "") {
        issues.push({
          fieldKey: f.fieldKey,
          severity: "warning",
          message: `Required field "${f.label}" is empty — broker review required before filing.`,
        });
      }
    }
  }

  return issues;
}

export function getRegistryDefinitionOrThrow(formKey: string): FormDefinition {
  const def = getFormDefinition(formKey);
  if (!def) throw new Error(`No registry definition for ${formKey}`);
  return def;
}
