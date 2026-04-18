import type { FormDefinition } from "@/modules/form-engine/form-engine.types";

export function listMissingRequiredForForm(
  mappedKeys: Set<string>,
  form: FormDefinition,
): string[] {
  return form.fieldDefinitions.filter((f) => f.required && !mappedKeys.has(f.key)).map((f) => f.key);
}
