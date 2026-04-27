import { getPricingData, type PricingDataSource, type PricingStatsRow } from "@/lib/services/pricingEngine";

import { analyzeListing, type ListingAgentAnalysis, type ListingAgentInput } from "./listingAgent";
import { buildSignalsFromPricingRow, type ListingSignals } from "./signals";
import { decidePricing, type OptimizationDecision } from "./optimizer";

export type OptimizeListingContext = {
  /** Row from `getPricingData` (or undefined if not loaded). */
  pricingRow?: PricingStatsRow;
  viewCount?: number;
};

export type OptimizeListingResult = {
  analysis: ListingAgentAnalysis;
  signals: ListingSignals;
  decision: OptimizationDecision;
};

/**
 * Single entry: listing quality (agent) + performance signals + pricing decision (no direct DB writes here).
 */
export function optimizeListing(
  listing: ListingAgentInput,
  ctx: OptimizeListingContext
): OptimizeListingResult {
  const analysis = analyzeListing(listing);
  const signals = ctx.pricingRow
    ? buildSignalsFromPricingRow(ctx.pricingRow, ctx.viewCount ?? 0)
    : buildSignalsFromPricingRow(undefined, ctx.viewCount ?? 0);
  const decision = decidePricing(signals);
  return { analysis, signals, decision };
}

/**
 * Merges generative copy + pricing decision for UI / persistence. `dynamicPrice` is the rules decision (not an apply).
 */
export function buildSuggestions(
  _listing: ListingAgentInput,
  result: OptimizeListingResult
): {
  title?: string;
  price?: number;
  dynamicPrice?: OptimizationDecision;
} {
  const suggestions: {
    title?: string;
    price?: number;
    dynamicPrice?: OptimizationDecision;
  } = {};

  if (result.analysis.suggestions?.title) {
    suggestions.title = result.analysis.suggestions.title;
  }
  if (result.analysis.suggestions?.price != null) {
    suggestions.price = result.analysis.suggestions.price;
  }
  if (result.decision.action !== "none") {
    suggestions.dynamicPrice = result.decision;
  }
  return suggestions;
}

/**
 * For events: load pricing row by id/source and run the full optimize step.
 */
export async function runOptimizeForListingId(
  listing: ListingAgentInput,
  listingId: string,
  source: PricingDataSource,
  viewCount = 0
): Promise<OptimizeListingResult> {
  const rows = await getPricingData(listingId, source);
  const pricingRow = rows[0];
  return optimizeListing(listing, { pricingRow, viewCount });
}
