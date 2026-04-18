import type { Deal } from "@prisma/client";
import { mapDealToTemplateFields } from "@/modules/form-mapping/field-mapper.service";
import { getFormByKey } from "@/modules/form-engine/form-registry.service";

export function mapDealToRegisteredForm(deal: Deal, formKey: string) {
  const form = getFormByKey(formKey);
  const base = mapDealToTemplateFields(deal, formKey);
  return {
    ...base,
    formMeta: form ? { title: form.title, formCode: form.formCode, categories: form.scenarioTags } : null,
  };
}
