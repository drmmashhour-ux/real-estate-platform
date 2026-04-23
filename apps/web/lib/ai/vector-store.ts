import { OpenAIEmbeddings } from "@langchain/openai";
import { toDeterministicEmbedding } from "@/src/modules/knowledge/processing/embeddingService";

const DETERMINISTIC_DIM = 32;

let openaiEmbeddings: OpenAIEmbeddings | null | undefined;

/**
 * OpenAI embeddings when `OPENAI_API_KEY` is set (production PDF ingest + retrieval).
 * Lazy singleton to avoid constructing clients on cold paths.
 */
export function getOpenAIEmbeddings(): OpenAIEmbeddings | null {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return null;
  if (openaiEmbeddings === undefined) {
    openaiEmbeddings = new OpenAIEmbeddings({
      model: "text-embedding-3-small",
      apiKey: key,
    });
  }
  return openaiEmbeddings;
}

/**
 * Chunk/query embedding for `vector_documents`: prefer OpenAI; fall back to deterministic 32-D (offline dev).
 * Stored vectors must be embedded with the **same** mode as search queries for cosine to be meaningful.
 */
export async function embedForVectorStore(text: string): Promise<number[]> {
  const safe = text.replace(/\0/g, "").slice(0, 120_000);
  const oa = getOpenAIEmbeddings();
  if (oa) {
    return oa.embedQuery(safe.slice(0, 12_000));
  }
  return toDeterministicEmbedding(safe, DETERMINISTIC_DIM);
}

/** @deprecated alias — use `embedForVectorStore` */
export const embedText = embedForVectorStore;
