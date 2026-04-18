import type { KnowledgeDocumentType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { tagChunkForLegalKnowledge } from "@/src/modules/knowledge/processing/chunkTaggingService";
import { toDeterministicEmbedding } from "@/src/modules/knowledge/processing/embeddingService";
import type { LegalIngestPayload } from "./legal-knowledge.types";
import { parsePlaintextToSections } from "./legal-chunking.service";

export { parsePlaintextToSections } from "./legal-chunking.service";

/**
 * Persists a knowledge document and chunked rows for retrieval (admin/ops pipeline; broker UI reads only).
 */
export async function indexLegalMaterial(payload: LegalIngestPayload): Promise<{ documentId: string; chunkCount: number }> {
  const docType = payload.documentType as KnowledgeDocumentType;

  const doc = await prisma.knowledgeDocument.create({
    data: {
      title: payload.sourceName,
      type: docType,
      fileUrl: payload.fileUrl,
    },
  });

  let chunkCount = 0;
  for (const sec of payload.sections) {
    const tags = tagChunkForLegalKnowledge(sec.content, docType === "law" ? "law" : docType === "drafting" ? "drafting" : "internal");
    const embedding = toDeterministicEmbedding(sec.content);
    await prisma.knowledgeChunk.create({
      data: {
        documentId: doc.id,
        content: `[${sec.sectionTitle}]\n${sec.content}`,
        chunkType: tags.chunkType,
        audience: tags.audience,
        importance: tags.importance,
        pageNumber: sec.pageNumber ?? undefined,
        embedding,
      },
    });
    chunkCount += 1;
  }

  await prisma.draftingKnowledgeIngestion.create({
    data: {
      sourceType: docType,
      title: payload.sourceName,
      fileUrl: payload.fileUrl,
      status: "indexed",
      metadata: { documentId: doc.id, chunkCount } as object,
    },
  });

  return { documentId: doc.id, chunkCount };
}
