import { getFormByKey, listRegisteredForms } from "./form-registry.service";
import type { FormDefinition } from "./form-engine.types";

export function getFormSchema(formKey: string): FormDefinition | null {
  return getFormByKey(formKey);
}

export function listFormSchemas(): FormDefinition[] {
  return listRegisteredForms();
}
