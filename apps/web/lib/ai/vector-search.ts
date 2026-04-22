import { prisma } from "@/lib/db";
import { cosineSimilarity, toDeterministicEmbedding } from "@/src/modules/knowledge/processing/embeddingService";

const EMBED_DIMS = 32;

export async function embedText(text: string): Promise<number[]> {
  return toDeterministicEmbedding(text, EMBED_DIMS);
}

function parseEmbedding(raw: unknown): number[] | null {
  if (Array.isArray(raw) && raw.every((x) => typeof x === "number")) return raw as number[];
  return null;
}

/** Cosine similarity in [−1, 1]; expects same length vectors. */
export function cosineSimilarityVectors(a: number[], b: number[]): number {
  return cosineSimilarity(a, b);
}

export async function searchVectors(query: string, opts?: { limit?: number }) {
  const q = await embedText(query);
  const docs = await prisma.vectorDocument.findMany({
    select: {
      id: true,
      sourceKey: true,
      title: true,
      content: true,
      embedding: true,
      metadata: true,
      createdAt: true,
    },
  });

  const limit = opts?.limit ?? 10;

  return docs
    .map((d) => {
      const emb = parseEmbedding(d.embedding);
      const score = emb && emb.length === q.length ? cosineSimilarityVectors(q, emb) : -1;
      return { ...d, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
