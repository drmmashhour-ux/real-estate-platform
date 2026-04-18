import type { Deal } from "@prisma/client";
import { runPrefillForForm } from "@/modules/prefill/prefill.service";
import { renderHumanReadableDraft } from "./draft-renderer.service";
import type { DraftGenerationResult } from "./document-generation.types";

export async function generateDraftArtifacts(deal: Deal, formKey: string): Promise<DraftGenerationResult[] | { error: string }> {
  const prefill = await runPrefillForForm(deal, formKey);
  if ("error" in prefill) return prefill;

  const structured: DraftGenerationResult = {
    kind: "structured_json",
    label: "Structured draft (JSON)",
    payload: {
      formKey: prefill.formKey,
      mappedFields: prefill.mappedFields,
      missingRequiredFields: prefill.missingRequiredFields,
      warnings: prefill.warnings,
      explainability: prefill.explainability,
    },
    draftNotice: "Draft assistance — broker review required.",
  };

  const human: DraftGenerationResult = {
    kind: "human_readable",
    label: "Review draft (text)",
    payload: { text: renderHumanReadableDraft(prefill) },
    draftNotice: "Draft assistance — broker review required.",
  };

  return [structured, human];
}
