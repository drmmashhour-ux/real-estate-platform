import type { Deal } from "@prisma/client";
import type { FormDefinition } from "@/modules/form-engine/form-engine.types";

export function suggestAutofillFromExecutionMetadata(deal: Deal, form: FormDefinition): { fieldKey: string; hint: string }[] {
  const meta = deal.executionMetadata && typeof deal.executionMetadata === "object" ? (deal.executionMetadata as Record<string, unknown>) : {};
  const out: { fieldKey: string; hint: string }[] = [];
  if (form.fieldDefinitions.some((f) => f.key === "financing_deadline") && !meta.financingDeadline) {
    out.push({ fieldKey: "financing_deadline", hint: "Consider financing condition deadline from lender discussion." });
  }
  if (form.fieldDefinitions.some((f) => f.key === "deposit") && !meta.depositCents) {
    out.push({ fieldKey: "deposit", hint: "Deposit amount may be recorded in execution metadata when confirmed." });
  }
  return out;
}
