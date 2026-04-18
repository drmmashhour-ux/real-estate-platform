import type { FormDefinition } from "./form-engine.types";

export function listFieldsForForm(form: FormDefinition) {
  return form.fieldDefinitions;
}

export function fieldKeysByFamily(form: FormDefinition, family: (typeof form.fieldDefinitions)[number]["family"]) {
  return form.fieldDefinitions.filter((f) => f.family === family).map((f) => f.key);
}
