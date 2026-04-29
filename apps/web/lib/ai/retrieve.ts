import "server-only";

/** Internal draft indexer — returns at least one stub passage so callers can assemble drafts offline. */
export async function retrieveDraftingContext(
  _question: string,
  _opts?: { formType?: string },
): Promise<{ sourceKey: string; content: string; weightedScore: number; title: string }[]> {
  return [
    {
      sourceKey: "stub_index",
      content: "(Stub retrieval passage — replace with vector index.)",
      weightedScore: 1,
      title: "Stub",
    },
  ];
}
