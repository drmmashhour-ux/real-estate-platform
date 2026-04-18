import type { Deal } from "@prisma/client";
import { buildFieldPrefillProposal } from "@/modules/drafting-ai/field-prefill-engine";
import { mapAiOutputToRegistryStrict } from "./ai-field-mapper.service";
import { validateMappedFieldsAgainstRegistry } from "./ai-validation.service";

export type AiStructuredContractOutput = {
  formType: string;
  mappedFields: Record<string, unknown>;
  confidences: import("./ai-field-mapper.service").MappedFieldConfidence[];
  validationIssues: import("./ai-validation.service").FieldValidationIssue[];
  disclaimer: string;
};

/**
 * Produces structured field payloads only — no free-form legal prose. Uses deterministic prefill proposals filtered by registry.
 */
export function generateStructuredContractFieldsForForm(formKey: string, deal: Deal): AiStructuredContractOutput {
  const prefill = buildFieldPrefillProposal(deal);
  const candidate: Record<string, unknown> = {};
  for (const row of prefill) {
    candidate[row.fieldKey] = row.proposedValue;
  }

  const strict = mapAiOutputToRegistryStrict(formKey, candidate, 0.75);
  const validationIssues = validateMappedFieldsAgainstRegistry(formKey, strict.mappedFields);

  return {
    formType: strict.formType,
    mappedFields: strict.mappedFields,
    confidences: strict.confidences,
    validationIssues,
    disclaimer: strict.disclaimer,
  };
}
