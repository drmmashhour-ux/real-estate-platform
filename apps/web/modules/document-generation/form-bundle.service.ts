import type { FormDefinition } from "@/modules/form-engine/form-engine.types";

export function buildFormBundleDescriptor(principal: FormDefinition | null, annexes: FormDefinition[]) {
  return {
    principal: principal ? { formKey: principal.formKey, title: principal.title } : null,
    annexes: annexes.map((a) => ({ formKey: a.formKey, title: a.title })),
    disclaimer: "Bundle descriptor for brokerage file organization — not a filing instruction.",
  };
}
