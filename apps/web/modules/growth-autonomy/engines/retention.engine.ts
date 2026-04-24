import { getFunnelSnapshot } from "../context.service";

/**
 * Increases repeat use and triggers re-engagement.
 */
export async function runRetentionOptimization() {
  const snapshot = await getFunnelSnapshot();
  const suggestions: string[] = [];

  if (snapshot.retention < 0.5) {
    suggestions.push("Send monthly marketplace performance rollup to inactive brokers");
    suggestions.push("Show 'new in your area' badges on search results for repeat visitors");
  }

  return { suggestions };
}
