import type { Deal } from "@prisma/client";
import { getFormByKey } from "@/modules/form-engine/form-registry.service";
import { evaluateFormDependencyHints } from "@/modules/form-engine/form-dependency.service";

export function evaluateDealFormDependencies(deal: Deal, formKey: string) {
  const form = getFormByKey(formKey);
  if (!form) return { ok: false, messages: ["Unknown formKey in registry"] };
  return evaluateFormDependencyHints(deal, form);
}
