import "server-only";

export type RetrievedPassage = {
  sourceKey: string;
  content: string;
  weightedScore: number;
  title: string;
};

/** Vector retrieval stub — returns no passages (route returns 422-style path when empty is invalid for product). */
export async function retrieveDraftingContext(_question: string): Promise<RetrievedPassage[]> {
  return [];
}
