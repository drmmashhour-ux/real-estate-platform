import { prisma } from "@/lib/db";
import { embedForVectorStore } from "@/lib/ai/vector-store";
import { cosineSimilarity } from "@/src/modules/knowledge/processing/embeddingService";

function parseEmbedding(raw: unknown): number[] | null {
  if (Array.isArray(raw) && raw.every((x) => typeof x === "number")) return raw as number[];
  return null;
}

/** Cosine similarity in [−1, 1]; vectors must match length (OpenAI vs legacy deterministic ingest). */
export function cosineSimilarityVectors(a: number[], b: number[]): number {
  return cosineSimilarity(a, b);
}

/** Alias for spec / external docs. */
export const cosine = cosineSimilarityVectors;

export type VectorSearchHit = {
  sourceKey: string;
  title: string | null;
  content: string;
  score: number;
  metadata: unknown;
  origin: "vector_document" | "knowledge_chunk";
};

const DEFAULT_CHUNK_SCAN_CAP = 2000;

/**
 * Query embedding — same pipeline as ingest (`embedForVectorStore`: OpenAI when configured, else 32-D deterministic).
 * Re-exported for `/api/ai/internal-embed` and tooling.
 */
export async function embedText(text: string): Promise<number[]> {
  return embedForVectorStore(text);
}

/**
 * Core retrieval: cosine over stored embeddings + optional source-key filter.
 * Rows whose embedding dimension ≠ query embedding are skipped (mixed ingest modes).
 */
export async function searchVectors(
  query: string,
  opts?: {
    limit?: number;
    chunkScanCap?: number;
    origins?: Array<"vector_document" | "knowledge_chunk">;
    allowedSourceKeys?: string[];
  },
): Promise<VectorSearchHit[]> {
  const q = await embedForVectorStore(query);
  const limit = opts?.limit ?? 10;
  const chunkScanCap = opts?.chunkScanCap ?? DEFAULT_CHUNK_SCAN_CAP;
  const allowList = opts?.allowedSourceKeys?.filter(Boolean);
  const allowSet = allowList?.length ? new Set(allowList) : null;

  const origins =
    allowSet != null
      ? (["vector_document"] as Array<"vector_document" | "knowledge_chunk">)
      : (opts?.origins ?? (["vector_document", "knowledge_chunk"] as const));

  const wantDocs = origins.includes("vector_document");
  const wantChunks = allowSet == null && origins.includes("knowledge_chunk");

  const [docs, chunks] = await Promise.all([
    wantDocs
      ? prisma.vectorDocument.findMany({
          where: allowSet ? { sourceKey: { in: [...allowSet] } } : undefined,
          select: {
            sourceKey: true,
            title: true,
            content: true,
            embedding: true,
            metadata: true,
          },
        })
      : Promise.resolve([] as Awaited<ReturnType<typeof prisma.vectorDocument.findMany>>),
    wantChunks
      ? prisma.knowledgeChunk.findMany({
          select: {
            id: true,
            documentId: true,
            content: true,
            embedding: true,
            document: { select: { title: true } },
          },
          take: chunkScanCap,
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([] as Awaited<ReturnType<typeof prisma.knowledgeChunk.findMany>>),
  ]);

  const scored: VectorSearchHit[] = [];

  for (const d of docs) {
    if (allowSet && !allowSet.has(d.sourceKey)) continue;
    const emb = parseEmbedding(d.embedding);
    const score = emb && emb.length === q.length ? cosineSimilarityVectors(q, emb) : -1;
    scored.push({
      sourceKey: d.sourceKey,
      title: d.title,
      content: d.content,
      score,
      metadata: d.metadata,
      origin: "vector_document",
    });
  }

  for (const c of chunks) {
    const emb = c.embedding?.length ? c.embedding : null;
    const score = emb && emb.length === q.length ? cosineSimilarityVectors(q, emb) : -1;
    scored.push({
      sourceKey: `knowledge_chunk:${c.documentId}:${c.id}`,
      title: c.document?.title ?? null,
      content: c.content,
      score,
      metadata: { documentId: c.documentId, chunkId: c.id },
      origin: "knowledge_chunk",
    });
  }

  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}

/** Alias matching “single vector index” naming. */
export async function searchVector(query: string, limit = 10): Promise<VectorSearchHit[]> {
  return searchVectors(query, { limit, origins: ["vector_document"] });
}
