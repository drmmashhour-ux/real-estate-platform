/**
 * Production alerting — logs [ALERT] lines for log drains (Datadog, etc.).
 */
export function sendAlert(message: string) {
  console.error("[ALERT]", message);
}

/** Fire when search/booking conversion for a listing drops below threshold (0–1 scale). */
export function alertIfLowConversion(
  listingId: string,
  conversionRate: number | null | undefined,
  threshold = 0.01,
) {
  if (conversionRate == null || Number.isNaN(conversionRate)) return;
  if (conversionRate < threshold) {
    sendAlert(`Low conversion on listing ${listingId}`);
  }
}

/** Fire when trust / quality score indicates elevated risk (0–100 scale). */
export function alertIfHighRiskListing(
  listingId: string,
  trustScore: number | null | undefined,
  threshold = 40,
) {
  if (trustScore == null || Number.isNaN(trustScore)) return;
  if (trustScore < threshold) {
    sendAlert(`High risk listing detected: ${listingId}`);
  }
}
