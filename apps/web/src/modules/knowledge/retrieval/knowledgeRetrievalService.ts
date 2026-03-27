import { getLegalContext } from "@/src/modules/knowledge/retrieval/legalContextRetrievalService";
import type { KnowledgeDocumentType } from "@prisma/client";

export { getLegalContext } from "@/src/modules/knowledge/retrieval/legalContextRetrievalService";
export type { LegalContextChunk, LegalContextFilters } from "@/src/modules/knowledge/retrieval/legalContextRetrievalService";

/**
 * Back-compat search — delegates to structured legal context retrieval.
 */
export async function searchKnowledge(
  query: string,
  context?: { type?: KnowledgeDocumentType; limit?: number },
) {
  const rows = await getLegalContext(query, {
    documentType: context?.type,
    limit: context?.limit,
  });
  return rows.map((r) => ({
    chunkId: r.chunkId,
    content: r.content,
    pageNumber: r.pageNumber,
    score: r.score,
    chunkType: r.chunkType,
    audience: r.audience,
    importance: r.importance,
    source: {
      documentId: r.source.documentId,
      title: r.source.title,
      type: r.source.documentType,
      fileUrl: r.source.fileUrl,
    },
  }));
}
