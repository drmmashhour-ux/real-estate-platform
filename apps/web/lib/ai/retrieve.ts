import { searchVectors } from "./vector-search";

export type DraftingContextChunk = {
  sourceKey: string;
  content: string;
  confidence: number;
};

export async function retrieveDraftingContext(query: string): Promise<DraftingContextChunk[]> {
  const results = await searchVectors(query);

  if (!results.length) {
    throw new Error("NO_SOURCE_CONTEXT");
  }

  return results.map((r) => ({
    sourceKey: r.sourceKey,
    content: r.content,
    confidence: r.score,
  }));
}
