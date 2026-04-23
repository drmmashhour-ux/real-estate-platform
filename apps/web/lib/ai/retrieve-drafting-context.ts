import { retrieveDraftingContext as retrieveOaciqPassages } from "@/lib/ai/drafting-retrieval";

export type RetrievedPassage = {
  sourceKey: string;
  title?: string | null;
  content: string;
  similarity: number;
  weightedScore: number;
};

/**
 * Retrieval-first: ranked passages from approved sources only; official OACIQ keys boosted via `SOURCE_PRIORITY`.
 */
export async function retrieveDraftingContextForForm(input: { formType: string; query: string }): Promise<RetrievedPassage[]> {
  const rows = await retrieveOaciqPassages({
    formType: input.formType,
    userQuery: input.query,
    transactionType: "sale",
  });

  return rows.map((r) => ({
    sourceKey: r.sourceKey,
    title: r.sourceLabel,
    content: r.excerpt,
    similarity: r.confidence,
    weightedScore: r.confidence,
  }));
}

/** Alias matching external drafting API naming. */
export const retrieveDraftingContext = retrieveDraftingContextForForm;
