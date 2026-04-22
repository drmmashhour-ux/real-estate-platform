import { retrieveDraftingContext } from "./retrieve";
import { runInternalDraftGeneration, type InternalDraftResult } from "./internal-draft-runner";
import { validateDraft, checkConsistency } from "@/lib/compliance/draft-validation";

export type GenerateDraftInput = {
  formType: string;
  facts: Record<string, unknown>;
  /** Optional listing snapshot for contradiction checks */
  listing?: { address?: string | null };
};

export type GenerateDraftOutput = InternalDraftResult & {
  validation: ReturnType<typeof validateDraft>;
  consistency: ReturnType<typeof checkConsistency>;
};

function assertHardRules(draft: InternalDraftResult, validation: ReturnType<typeof validateDraft>): void {
  if (!draft.sourceUsed || draft.sourceUsed.length === 0) {
    throw new Error("NO_SOURCE_CONTEXT");
  }
  if (!validation.valid) {
    throw new Error("DRAFT_INVALID");
  }
}

function assertConsistency(consistency: ReturnType<typeof checkConsistency>): void {
  if (!consistency.valid) {
    throw new Error("CONTRADICTION_DETECTED");
  }
}

/**
 * Source-grounded draft: retrieval → assembly → validation → hard rules.
 */
export async function generateDraft(input: GenerateDraftInput): Promise<GenerateDraftOutput> {
  const query = `${input.formType} ${JSON.stringify(input.facts ?? {})}`;
  const sources = await retrieveDraftingContext(query);

  const draft = runInternalDraftGeneration({
    formType: input.formType,
    facts: input.facts ?? {},
    sources,
  });

  const validation = validateDraft(draft.fields);
  assertHardRules(draft, validation);

  const consistency = checkConsistency({
    listing: input.listing,
    draft: draft.fields,
  });
  assertConsistency(consistency);

  return {
    ...draft,
    validation,
    consistency,
  };
}
