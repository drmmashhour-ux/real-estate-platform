/**
 * Enrich growth surfaces with autonomy signal context — recommendations only; no outbound execution.
 */

import type { MarketplaceSignal } from "../darlink-marketplace-autonomy.types";

export function autonomySignalsForGrowthHints(signals: MarketplaceSignal[]): readonly string[] {
  try {
    return signals
      .filter((s) => s.type === "engagement_spike" || s.type === "high_interest" || s.type === "low_conversion")
      .slice(0, 12)
      .map((s) => s.explanation);
  } catch {
    return [];
  }
}
