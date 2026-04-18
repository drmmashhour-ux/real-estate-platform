/**
 * Refresh suggestions — content drafts only.
 */
export function suggestListingRefreshReasons(daysSinceUpdate: number) {
  if (daysSinceUpdate > 21) {
    return {
      stale: true,
      suggestions: ["Refresh hero photo order", "Update description with seasonal angle", "Verify price still current"],
    };
  }
  return { stale: false, suggestions: ["No refresh required based on recency heuristic."] };
}
