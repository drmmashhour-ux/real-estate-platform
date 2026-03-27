import { prisma } from "@/lib/db";
import { processKnowledgeDocument } from "@/src/modules/knowledge/processing/processKnowledgeDocument";
import { extractTextFromPdfOrSource } from "@/src/modules/knowledge/processing/pdfExtractionService";

export async function uploadKnowledgeDocument(args: {
  title: string;
  type: "law" | "drafting" | "internal";
  fileUrl: string;
  rawText?: string;
}) {
  const doc = await prisma.knowledgeDocument.create({
    data: { title: args.title, type: args.type as any, fileUrl: args.fileUrl },
  });
  const extracted = await extractTextFromPdfOrSource({ fileUrl: args.fileUrl, rawText: args.rawText });
  const processed = await processKnowledgeDocument({
    documentId: doc.id,
    rawText: extracted.text,
    pageCount: extracted.pageCount,
  });
  return { document: doc, chunkCount: processed.chunkCount };
}
