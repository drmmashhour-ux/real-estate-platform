/**
 * Deal finder is discovery-only: no autonomous purchase or mandate execution.
 */

export function assertNoAutonomousPurchaseDeal(metadata?: Record<string, unknown> | null): void {
  if (metadata?.autoPurchase === true || metadata?.executeTrade === true) {
    throw new Error("AUTONOMOUS_PURCHASE_NOT_ALLOWED");
  }
}

export function assertDealFinderDataLayerEnabled(): void {
  if (process.env.LECIPM_DEAL_FINDER_DATA_LAYER !== "true") {
    throw new Error("DATA_SOURCE_REQUIRED");
  }
}

/** Require numeric deal metrics before persisting or narrating a scored row. */
export function assertDealMetricsPresent(deal: {
  askingPriceCents?: number | null;
  dealScore?: number | null;
  capRate?: number | null;
}): void {
  if (deal.askingPriceCents == null || !Number.isFinite(deal.askingPriceCents)) {
    throw new Error("METRICS_REQUIRED");
  }
  if (deal.dealScore == null || !Number.isFinite(deal.dealScore)) {
    throw new Error("METRICS_REQUIRED");
  }
  if (deal.capRate == null || !Number.isFinite(deal.capRate)) {
    throw new Error("METRICS_REQUIRED");
  }
}

export function markDealLowConfidence(reasons: string[]): { lowConfidence: boolean; notes: string[] } {
  return {
    lowConfidence: reasons.length > 0,
    notes: reasons,
  };
}
