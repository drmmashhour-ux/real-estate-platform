/**
 * Buy-box engine is discovery-only: no autonomous purchase or mandate execution.
 */

const GUARANTEED_PROFIT_RE =
  /guaranteed\s+(profit|return)|certain\s+winner|risk-?free\s+(return|profit)|can't\s+lose|cannot\s+lose/i;

export function assertNoAutonomousPurchase(metadata?: Record<string, unknown> | null): void {
  if (metadata?.autoPurchase === true || metadata?.executeTrade === true) {
    throw new Error("AUTONOMOUS_PURCHASE_NOT_ALLOWED");
  }
}

export function assertBuyBoxDealMetricsPresent(deal: {
  askingPriceCents?: number | null;
  listingId?: string | null;
}): void {
  if (deal.askingPriceCents == null || !Number.isFinite(deal.askingPriceCents)) {
    throw new Error("DEAL_METRICS_REQUIRED");
  }
  if (!deal.listingId?.trim()) {
    throw new Error("DEAL_METRICS_REQUIRED");
  }
}

export function assertMatchRationalePresent(rationale: unknown): void {
  if (!rationale || typeof rationale !== "object" || Array.isArray(rationale)) {
    throw new Error("MATCH_RATIONALE_REQUIRED");
  }
  const r = rationale as Record<string, unknown>;
  if (!Array.isArray(r.reasons) || r.reasons.length === 0) {
    throw new Error("MATCH_RATIONALE_REQUIRED");
  }
}

export function assertBuyBoxAiLanguageSafe(text: string): void {
  if (GUARANTEED_PROFIT_RE.test(text)) {
    throw new Error("GUARANTEED_OUTCOME_LANGUAGE_FORBIDDEN");
  }
}

export function assertBuyBoxDataLayerEnabled(): void {
  if (process.env.LECIPM_BUY_BOX_DATA_LAYER !== "true") {
    throw new Error("DATA_SOURCE_REQUIRED");
  }
}
