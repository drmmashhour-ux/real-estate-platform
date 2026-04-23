import { prisma } from "@/lib/db";
import { embedForVectorStore } from "@/lib/ai/vector-store";

/** Ingest one chunk into `vector_documents` — embeddings match `searchVectors` / `embedForVectorStore`. */
export async function ingestVectorDocument(input: {
  sourceKey: string;
  title?: string | null;
  content: string;
  metadata?: Record<string, unknown> | null;
}) {
  const content = input.content.slice(0, 500_000);
  const embedding = await embedForVectorStore(content);

  return prisma.vectorDocument.create({
    data: {
      sourceKey: input.sourceKey,
      title: input.title ?? null,
      content,
      embedding,
      metadata: input.metadata ?? undefined,
    },
  });
}
