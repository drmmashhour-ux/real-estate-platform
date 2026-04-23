import type { DraftingFormType } from "@/lib/ai/drafting-policy";
import { retrieveDraftingContextForForm } from "@/lib/ai/retrieve-drafting-context";

export type DraftingContextChunk = {
  sourceKey: string;
  content: string;
  confidence: number;
};

export type RetrieveDraftingContextOptions = {
  /** When omitted, `"other"` allow-list applies (books + generic OACIQ bucket). */
  formType?: DraftingFormType | string;
};

/**
 * Policy-aware retrieval: approved OACIQ + book `sourceKey` rows only (see `drafting-policy.ts`).
 */
export async function retrieveDraftingContext(
  query: string,
  opts?: RetrieveDraftingContextOptions,
): Promise<DraftingContextChunk[]> {
  const formType = opts?.formType ?? "other";
  const passages = await retrieveDraftingContextForForm({ formType: String(formType), query });

  if (!passages.length) {
    throw new Error("NO_SOURCE_CONTEXT_AVAILABLE");
  }

  return passages.map((p) => ({
    sourceKey: p.sourceKey,
    content: p.content,
    confidence: p.weightedScore,
  }));
}
