import type { KnowledgeDocumentType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getLegalContext, type LegalContextChunk } from "@/src/modules/knowledge/retrieval/legalContextRetrievalService";
import type { StructuredLegalChunk } from "./legal-knowledge.types";
import { mapDocumentTypeToMaterialType, mapSemanticToMaterialType } from "./legal-knowledge.mappers";

export type { LegalContextChunk };

/** Lists registered drafting / law sources (metadata only — no full text). */
export async function listLegalSourceCatalog(take = 40) {
  return prisma.draftingSource.findMany({
    orderBy: { createdAt: "desc" },
    take,
    select: { id: true, title: true, referenceLabel: true, versionLabel: true, sourceType: true },
  });
}

/** Semantic retrieval over ingested knowledge chunks (embeddings + filters). */
export async function retrieveLegalContextForQuery(query: string, opts?: { documentType?: KnowledgeDocumentType; limit?: number }) {
  return getLegalContext(query, {
    documentType: opts?.documentType,
    limit: opts?.limit ?? 8,
  });
}

/** Normalizes DB chunks to broker-facing structured items with material typing. */
export function toStructuredChunks(rows: LegalContextChunk[]): StructuredLegalChunk[] {
  return rows.map((r) => ({
    id: r.chunkId,
    sourceName: r.source.title,
    pageNumber: r.pageNumber,
    sectionTitle: inferSectionTitle(r.content),
    content: r.content,
    type: mapSemanticToMaterialType(r.chunkType, r.source.documentType),
    score: r.score,
  }));
}

function inferSectionTitle(content: string): string {
  const line = content.split("\n")[0]?.trim() ?? "";
  if (line.length > 120) return `${line.slice(0, 117)}…`;
  return line || "(section)";
}

export { mapDocumentTypeToMaterialType, mapSemanticToMaterialType };
