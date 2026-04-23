/**
 * Broker-execute path: policy-scoped retrieval + deterministic assembly (`internal-draft-runner`).
 * For JSON/LLM drafting + coverage gates, use `generateSourceGroundedDraft` and `POST /api/drafting/generate`.
 */
import { retrieveDraftingContext } from "./retrieve";
import { runInternalDraftGeneration, type InternalDraftResult } from "./internal-draft-runner";
import { validateDraft, checkConsistency } from "@/lib/compliance/draft-validation";
import { assertDraftSourceContext } from "@/lib/compliance/source-grounded";

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
  assertDraftSourceContext(draft);
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
 *
 * - Retrieval: policy-scoped `vector_documents` only (`drafting-policy` allow-list + source priority).
 * - Assembly: in-process `runInternalDraftGeneration` (same behavior as `POST /api/ai/internal-draft` for HTTP clients).
 * - Hard rules: `NO_SOURCE_CONTEXT`, `DRAFT_INVALID`, `CONTRADICTION_DETECTED` — AI output is not trusted until these pass.
 */
export async function generateDraft(input: GenerateDraftInput): Promise<GenerateDraftOutput> {
  const query = `${input.formType} ${JSON.stringify(input.facts ?? {})}`;
  const sources = await retrieveDraftingContext(query, { formType: input.formType });

  const draft = runInternalDraftGeneration({
    formType: input.formType,
    facts: input.facts ?? {},
    sources,
  });

  const validation = validateDraft({ formType: input.formType, fields: draft.fields });
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
