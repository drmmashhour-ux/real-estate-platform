import { retrieveDraftingContext } from "@/lib/ai/retrieve";
import { runInternalDraftGeneration, type InternalDraftResult } from "@/lib/ai/internal-draft-runner";

export function assertClauseSourceBacked(sourceUsed: string[] | undefined | null): void {
  if (!sourceUsed || sourceUsed.length === 0) {
    throw new Error("CLAUSE_NOT_SOURCE_BACKED");
  }
}

/**
 * Source-grounded clause assembly (in-process; safe for server components / route handlers).
 */
export async function generateClause(input: {
  formType: string;
  clauseType: string;
  facts: Record<string, unknown>;
}): Promise<InternalDraftResult> {
  const query = `${input.formType} ${input.clauseType}`;
  const sources = await retrieveDraftingContext(query, { formType: input.formType });
  const draft = runInternalDraftGeneration({
    formType: input.formType,
    facts: input.facts ?? {},
    sources,
    mode: "clause",
    clauseType: input.clauseType,
  });
  assertClauseSourceBacked(draft.sourceUsed);
  return draft;
}
