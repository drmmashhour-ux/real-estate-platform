/**
 * Search autocomplete suggestions — stub for deployment.
 */
export async function searchQuerySuggestions(q: string): Promise<string[]> {
  if (!q.trim()) return [];
  return [];
}
