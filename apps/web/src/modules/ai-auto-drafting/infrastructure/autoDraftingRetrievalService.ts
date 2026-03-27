import { getLegalContext, type LegalContextChunk } from "@/src/modules/knowledge/retrieval/legalContextRetrievalService";
import type { SourceRef } from "@/src/modules/ai-auto-drafting/domain/autoDrafting.types";

export async function retrieveDraftingContext(query: string, opts?: { audience?: "seller" | "broker" | "transaction"; limit?: number }) {
  return getLegalContext(query, {
    audience: opts?.audience ?? "seller",
    documentType: "drafting",
    limit: opts?.limit ?? 6,
  }).catch(() => [] as LegalContextChunk[]);
}

export async function retrieveLawContextForSection(sectionLabel: string, sectionKey: string) {
  const q = `${sectionLabel} ${sectionKey} seller disclosure obligation`;
  const law = await getLegalContext(q, { documentType: "law", audience: "seller", limit: 4 }).catch(() => []);
  if (law.length) return law;
  return getLegalContext(q, { audience: "seller", limit: 4 }).catch(() => []);
}

export function chunksToSourceRefs(chunks: LegalContextChunk[]): SourceRef[] {
  return chunks.map((c) => ({
    chunkId: c.chunkId,
    documentTitle: c.source.title,
    documentId: c.source.documentId,
    pageNumber: c.pageNumber,
    excerpt: c.content.length > 400 ? `${c.content.slice(0, 397)}...` : c.content,
    importance: c.importance,
  }));
}
