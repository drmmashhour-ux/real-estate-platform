import { searchVectors } from "@/lib/ai/vector-search";
import { rankSearchHits } from "@/lib/ai/source-ranking";
import { retrieveDraftingContext as retrievePolicyPassages } from "@/lib/ai/drafting-retrieval";

export type RetrievedGroundingPassage = {
  sourceKey: string;
  title: string | null;
  content: string;
  score: number;
  weightedScore: number;
};

/**
 * Unscoped retrieval over ingested PDF chunks only (no `knowledge_chunks`), ranked OACIQ > books.
 * Use for research Q&A and compliance explanations when no form allow-list applies.
 */
export async function retrievePassagesForQuery(query: string, limit = 8): Promise<RetrievedGroundingPassage[]> {
  const raw = await searchVectors(query, {
    limit: 80,
    origins: ["vector_document"],
  });
  const ranked = rankSearchHits(raw);
  return ranked.slice(0, limit).map((r) => ({
    sourceKey: r.sourceKey,
    title: r.title,
    content: r.content,
    score: r.score,
    weightedScore: r.weightedScore,
  }));
}

/**
 * Hard rule: no vectors → no grounded answer (callers must block freeform drafting).
 */
export async function retrieveDraftingContextOrThrow(query: string, limit = 8): Promise<RetrievedGroundingPassage[]> {
  const out = await retrievePassagesForQuery(query, limit);
  if (!out.length) {
    throw new Error("NO_SOURCE_CONTEXT_AVAILABLE");
  }
  return out;
}

/** Unscoped retrieval + empty guard (alias for Q&A / compliance callers). */
export async function retrieveDraftingContext(query: string, limit = 8): Promise<RetrievedGroundingPassage[]> {
  return retrieveDraftingContextOrThrow(query, limit);
}

/** Simple shape for drafting pipelines (`source` = indexed `sourceKey`). */
export type RetrievalResult = {
  source: string;
  content: string;
  confidence: number;
};

/**
 * Policy-scoped retrieval over ingested books + OACIQ PDFs (vector index).
 * Returns an empty array when nothing is indexed yet (callers should block or fall back).
 */
export async function retrieveDraftingSources(input: { query: string; formType: string }): Promise<RetrievalResult[]> {
  const rows = await retrievePolicyPassages({
    formType: input.formType,
    userQuery: input.query,
    transactionType: "sale",
  });
  return rows.map((r) => ({
    source: r.sourceKey,
    content: r.excerpt,
    confidence: Math.min(1, Math.max(0, r.confidence)),
  }));
}
