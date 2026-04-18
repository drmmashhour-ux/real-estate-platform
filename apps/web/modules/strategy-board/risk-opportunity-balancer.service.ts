import type { StrategyInsight } from "./strategy-board.types";

/** De-duplicate by title; cap list size for executive readability. */
export function balanceInsights(insights: StrategyInsight[], max = 12): StrategyInsight[] {
  const seen = new Set<string>();
  const out: StrategyInsight[] = [];
  for (const i of insights) {
    if (seen.has(i.title)) continue;
    seen.add(i.title);
    out.push(i);
    if (out.length >= max) break;
  }
  return out.sort((a, b) => {
    const u = { high: 3, medium: 2, low: 1 };
    return u[b.urgency] - u[a.urgency];
  });
}
