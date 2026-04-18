import type { KnowledgeDocumentType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getLegalContext, type LegalContextChunk } from "@/src/modules/knowledge/retrieval/legalContextRetrievalService";
import { cosineSimilarity, toDeterministicEmbedding } from "@/src/modules/knowledge/processing/embeddingService";

export type KeywordHit = {
  chunkId: string;
  content: string;
  documentTitle: string;
  pageNumber: number | null;
  keywordScore: number;
};

/**
 * Semantic retrieval (embeddings) — primary path for drafting assistance.
 */
export async function retrieveSemantic(
  query: string,
  opts?: { documentType?: KnowledgeDocumentType; limit?: number },
): Promise<LegalContextChunk[]> {
  return getLegalContext(query, { documentType: opts?.documentType, limit: opts?.limit ?? 10 });
}

/**
 * Keyword retrieval — deterministic supplement when embeddings are sparse.
 */
export async function retrieveKeyword(query: string, opts?: { documentType?: KnowledgeDocumentType; limit?: number }): Promise<KeywordHit[]> {
  const terms = query.toLowerCase().split(/[^a-z0-9àâäéèêëïîôùûüç]+/i).filter((t) => t.length > 2);
  const limit = Math.min(25, Math.max(1, opts?.limit ?? 12));
  const rows = await prisma.knowledgeChunk.findMany({
    where: opts?.documentType ? { document: { type: opts.documentType } } : {},
    include: { document: { select: { title: true } } },
    take: 800,
  });
  const scored: KeywordHit[] = rows.map((r) => {
    const low = r.content.toLowerCase();
    let score = 0;
    for (const t of terms) {
      if (low.includes(t)) score += 1;
    }
    return {
      chunkId: r.id,
      content: r.content,
      documentTitle: r.document.title,
      pageNumber: r.pageNumber,
      keywordScore: score,
    };
  });
  return scored.filter((s) => s.keywordScore > 0).sort((a, b) => b.keywordScore - a.keywordScore).slice(0, limit);
}

/**
 * Hybrid: merges semantic top results with keyword hits (dedup by chunk id).
 */
export async function retrieveHybrid(query: string, opts?: { documentType?: KnowledgeDocumentType; limit?: number }) {
  const limit = opts?.limit ?? 10;
  const [semantic, keyword] = await Promise.all([
    retrieveSemantic(query, { documentType: opts?.documentType, limit }),
    retrieveKeyword(query, { documentType: opts?.documentType, limit: Math.min(8, limit) }),
  ]);
  const qVec = toDeterministicEmbedding(query);
  const byId = new Map<string, { chunk: LegalContextChunk | KeywordHit; score: number; source: "semantic" | "keyword" | "both" }>();

  for (const s of semantic) {
    const embScore = cosineSimilarity(qVec, toDeterministicEmbedding(s.content.slice(0, 2000)));
    byId.set(s.chunkId, { chunk: s, score: s.score * 0.7 + embScore * 0.3, source: "semantic" });
  }
  for (const k of keyword) {
    const prev = byId.get(k.chunkId);
    const kScore = Math.min(1, k.keywordScore / 5);
    if (!prev) {
      byId.set(k.chunkId, { chunk: k, score: kScore * 0.4, source: "keyword" });
    } else {
      prev.score = Math.max(prev.score, prev.score * 0.85 + kScore * 0.15);
      prev.source = "both";
    }
  }

  return [...byId.entries()]
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, limit)
    .map(([id, v]) => ({ id, ...v }));
}
