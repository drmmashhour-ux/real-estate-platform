import type { Deal } from "@prisma/client";
import { mapDealToRegisteredForm } from "./deal-to-form.mapper";
import { getFormByKey } from "@/modules/form-engine/form-registry.service";
import { listMissingRequiredForForm } from "./missing-field.service";
import { suggestAutofillFromExecutionMetadata } from "./autofill-suggestions.service";
import type { PrefillEngineResult } from "./prefill.types";

export async function runPrefillForForm(deal: Deal, formKey: string): Promise<PrefillEngineResult | { error: string }> {
  const form = getFormByKey(formKey);
  if (!form) return { error: "unknown_form_key" };

  const mapped = mapDealToRegisteredForm(deal, formKey);
  const keys = new Set(Object.keys(mapped.mappedFields));
  const missingFromRegistry = listMissingRequiredForForm(keys, form);
  const suggestions = suggestAutofillFromExecutionMetadata(deal, form);

  const explainability = [
    "Mapped from platform deal record and execution metadata — verify against source instruments.",
    ...suggestions.map((s) => `Hint: ${s.fieldKey} — ${s.hint}`),
  ];

  return {
    formKey,
    templateKey: formKey,
    mappedFields: mapped.mappedFields,
    missingRequiredFields: [...new Set([...mapped.missingRequiredFields, ...missingFromRegistry])],
    warnings: mapped.warnings,
    confidence: 0.55,
    draftNotice: "Draft assistance — broker review required.",
    explainability,
  };
}
