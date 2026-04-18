import type { Deal } from "@prisma/client";
import type { FormDefinition } from "./form-engine.types";

export type DependencyCheckResult = { ok: boolean; messages: string[] };

/**
 * Lightweight rule hints — broker must confirm against office standards and official instructions.
 */
export function evaluateFormDependencyHints(deal: Deal, form: FormDefinition): DependencyCheckResult {
  const messages: string[] = [...form.dependencyRules];
  const meta = deal.executionMetadata && typeof deal.executionMetadata === "object" ? (deal.executionMetadata as Record<string, unknown>) : {};

  if (form.formKey.includes("counter") && !meta.priorPromiseReference) {
    messages.push("Counter-proposal workflows usually require a reference to the prior principal instrument — confirm in file.");
  }
  if (form.scenarioTags.includes("condo") && deal.dealExecutionType && !String(deal.dealExecutionType).includes("coownership")) {
    messages.push("Co-ownership form selected while deal execution type may not be co-ownership — verify.");
  }

  return { ok: true, messages };
}
