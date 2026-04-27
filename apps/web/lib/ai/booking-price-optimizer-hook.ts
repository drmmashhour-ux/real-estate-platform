import { getPricingData, type PricingDataSource } from "@/lib/services/pricingEngine";

import { buildSignalsFromPricingRow } from "./signals";
import { buildSuggestedCents, decidePricing } from "./optimizer";
import { proposePrice } from "./propose";

/**
 * Event-driven: `booking.created` → signals → decision → persisted suggestion (no apply).
 * Set `source` on the payload: `"bnhub"` (default) or `"marketplace"`.
 * Set `PRICE_OPTIMIZER_SUGGESTIONS=0` to skip.
 * Optional `viewCount` for signals (rare; usually 0).
 */
export async function runBookingPriceOptimizer(
  raw: Record<string, unknown>
): Promise<void> {
  if (process.env.PRICE_OPTIMIZER_SUGGESTIONS === "0") {
    return;
  }
  const listingId = typeof raw.listingId === "string" && raw.listingId.trim() ? raw.listingId.trim() : null;
  if (!listingId) {
    return;
  }
  const source: PricingDataSource = raw.source === "marketplace" ? "marketplace" : "bnhub";
  const viewCount = typeof raw.viewCount === "number" && Number.isFinite(raw.viewCount) ? raw.viewCount : 0;

  const rows = await getPricingData(listingId, source);
  const row = rows[0];
  if (!row) {
    return;
  }
  const baseCents = row.night_price_cents != null ? Number(row.night_price_cents) : NaN;
  if (!Number.isFinite(baseCents) || baseCents <= 0) {
    return;
  }

  const signals = buildSignalsFromPricingRow(row, viewCount);
  const decision = decidePricing(signals);
  if (decision.action === "none") {
    return;
  }
  const suggestedCents = buildSuggestedCents(baseCents, decision);
  if (suggestedCents == null) {
    return;
  }

  try {
    await proposePrice(listingId, suggestedCents, `optimizer:${decision.action}`);
  } catch (err) {
    console.error("[OPTIMIZER] proposePrice failed", { listingId, err });
    return;
  }
  console.log("[OPTIMIZER] suggestion created", listingId, { source, suggestedCents, decision: decision.action });
}
