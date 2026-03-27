import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import type { KnowledgeChunkAudience, KnowledgeChunkImportance, KnowledgeChunkSemanticType, KnowledgeDocumentType } from "@prisma/client";
import { cosineSimilarity, toDeterministicEmbedding } from "@/src/modules/knowledge/processing/embeddingService";

export type LegalContextFilters = {
  chunkType?: KnowledgeChunkSemanticType;
  audience?: KnowledgeChunkAudience;
  importance?: KnowledgeChunkImportance;
  documentType?: KnowledgeDocumentType;
  limit?: number;
};

export type LegalContextChunk = {
  chunkId: string;
  content: string;
  score: number;
  chunkType: KnowledgeChunkSemanticType;
  audience: KnowledgeChunkAudience;
  importance: KnowledgeChunkImportance;
  pageNumber: number | null;
  source: {
    documentId: string;
    title: string;
    documentType: KnowledgeDocumentType;
    fileUrl: string;
  };
};

/**
 * Primary retrieval API for grounded legal context (embeddings + metadata filters).
 */
export async function getLegalContext(query: string, context?: LegalContextFilters): Promise<LegalContextChunk[]> {
  const limit = Math.max(1, Math.min(25, context?.limit ?? 8));
  const qVec = toDeterministicEmbedding(query);

  const where: Prisma.KnowledgeChunkWhereInput = {
    ...(context?.chunkType ? { chunkType: context.chunkType } : {}),
    ...(context?.audience ? { audience: context.audience } : {}),
    ...(context?.importance ? { importance: context.importance } : {}),
    ...(context?.documentType ? { document: { type: context.documentType } } : {}),
  };

  const rows = await prisma.knowledgeChunk.findMany({
    where,
    include: { document: { select: { id: true, title: true, type: true, fileUrl: true } } },
    take: 1200,
  });

  const scored = rows.map((r) => ({
    chunkId: r.id,
    content: r.content,
    score: cosineSimilarity(qVec, r.embedding as number[]),
    chunkType: r.chunkType,
    audience: r.audience,
    importance: r.importance,
    pageNumber: r.pageNumber,
    source: {
      documentId: r.document.id,
      title: r.document.title,
      documentType: r.document.type,
      fileUrl: r.document.fileUrl,
    },
  }));

  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}
