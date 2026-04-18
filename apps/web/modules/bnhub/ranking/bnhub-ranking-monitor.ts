/**
 * Safe monitoring — never throws. Prefix: [bnhub:ranking] / [bnhub:pricing]
 */

export function recordBnhubRankingCalculated(count: number, meta?: Record<string, unknown>): void {
  try {
    console.info("[bnhub:ranking]", { count, ...meta });
  } catch {
    /* ignore */
  }
}

export function recordBnhubPricingSuggestion(confidence: string, lowData: boolean): void {
  try {
    console.info("[bnhub:pricing]", { confidence, lowData });
  } catch {
    /* ignore */
  }
}

export function recordBnhubPricingFallback(reason: string): void {
  try {
    console.info("[bnhub:pricing]", { fallback: reason });
  } catch {
    /* ignore */
  }
}
