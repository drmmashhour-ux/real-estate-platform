import { prisma } from "@/lib/db";
import { approximatePageForChunk } from "@/src/modules/knowledge/processing/pdfExtractionService";
import { splitIntoChunksByTokenBudget } from "@/src/modules/knowledge/processing/chunkingService";
import { tagChunkForLegalKnowledge } from "@/src/modules/knowledge/processing/chunkTaggingService";
import { toDeterministicEmbedding } from "@/src/modules/knowledge/processing/embeddingService";

export async function processKnowledgeDocument(args: { documentId: string; rawText: string; pageCount?: number }) {
  const doc = await prisma.knowledgeDocument.findUnique({ where: { id: args.documentId } });
  if (!doc) return { chunkCount: 0 };

  const chunks = splitIntoChunksByTokenBudget(args.rawText);
  await prisma.knowledgeChunk.deleteMany({ where: { documentId: args.documentId } });
  if (!chunks.length) return { chunkCount: 0 };

  const pageCount = args.pageCount && args.pageCount > 0 ? args.pageCount : 1;
  const fullText = args.rawText;

  await prisma.knowledgeChunk.createMany({
    data: chunks.map((content, idx) => {
      const tags = tagChunkForLegalKnowledge(content, doc.type);
      const pageNumber = approximatePageForChunk(content, idx, chunks, fullText, pageCount);
      return {
        documentId: args.documentId,
        content,
        chunkType: tags.chunkType,
        audience: tags.audience,
        importance: tags.importance,
        pageNumber,
        embedding: toDeterministicEmbedding(content),
      };
    }),
  });
  return { chunkCount: chunks.length };
}
