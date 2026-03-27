import { describe, expect, it } from "vitest";
import { splitIntoChunks, splitIntoChunksByTokenBudget } from "@/src/modules/knowledge/processing/chunkingService";
import { cosineSimilarity, toDeterministicEmbedding } from "@/src/modules/knowledge/processing/embeddingService";

describe("knowledge processing", () => {
  it("chunks deterministically", () => {
    const chunks = splitIntoChunks("a ".repeat(2000), 100);
    expect(chunks.length).toBeGreaterThan(1);
  });

  it("uses 500–1000 token char budget", () => {
    const body = "word ".repeat(2000);
    const chunks = splitIntoChunksByTokenBudget(body, 2000, 4000);
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks.every((c) => c.length <= 4000)).toBe(true);
  });

  it("embeds deterministically", () => {
    const a = toDeterministicEmbedding("legal disclosure requirement");
    const b = toDeterministicEmbedding("legal disclosure requirement");
    expect(a).toEqual(b);
    expect(cosineSimilarity(a, b)).toBeGreaterThan(0.99);
  });
});
