import { getListingAsAgentInput } from "./listing-agent-data";
import { buildSuggestions, runOptimizeForListingId, type OptimizeListingResult } from "./autoOptimizer";
import { saveOptimization } from "./saveOptimization";
import type { PricingDataSource } from "@/lib/services/pricingEngine";

/**
 * `booking.created` (and similar): quality + performance + decision → `ListingOptimization` row (no live listing mutations).
 * Set `AUTO_LISTING_OPTIMIZER=0` to skip.
 */
export async function runAutoListingOptimizerOnEvent(raw: Record<string, unknown>): Promise<void> {
  if (process.env.AUTO_LISTING_OPTIMIZER === "0") {
    return;
  }
  const listingId =
    typeof raw.listingId === "string" && raw.listingId.trim() ? raw.listingId.trim() : null;
  if (!listingId) {
    return;
  }
  const source: PricingDataSource = raw.source === "marketplace" ? "marketplace" : "bnhub";
  const viewCount = typeof raw.viewCount === "number" && Number.isFinite(raw.viewCount) ? raw.viewCount : 0;

  const listing = await getListingAsAgentInput(listingId, source);
  if (!listing) {
    return;
  }

  let result: OptimizeListingResult;
  try {
    result = await runOptimizeForListingId(listing, listingId, source, viewCount);
  } catch (e) {
    console.error("[AUTO OPTIMIZER] optimize failed", { listingId, e });
    return;
  }

  const suggestions = buildSuggestions(listing, result);
  if (Object.keys(suggestions).length === 0) {
    return;
  }

  try {
    await saveOptimization(listingId, {
      source,
      ...suggestions,
      score: result.analysis.score,
      issues: result.analysis.issues,
      confidence: result.analysis.confidence,
    });
  } catch (err) {
    console.error("[AUTO OPTIMIZER] saveOptimization failed", { listingId, err });
    return;
  }
  console.log("[AUTO OPTIMIZER] suggestion stored", listingId, { source });
}
