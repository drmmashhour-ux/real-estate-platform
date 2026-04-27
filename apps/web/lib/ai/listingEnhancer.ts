/**
 * Order 123 — surface a highlight when a peer benchmark exists and price is below it.
 * `marketPrice` should be a real comparison (e.g. same-city peer average from the API);
 * do not pass a made-up value.
 */
export type ListingsEnhancerInput = {
  price: number;
  marketPrice?: number | null;
} & Record<string, unknown>;

export function enhanceListing(
  l: ListingsEnhancerInput
): ListingsEnhancerInput & { highlight: string | null } {
  const market = l.marketPrice;
  const hasMarket = typeof market === "number" && Number.isFinite(market) && market > 0;
  return {
    ...l,
    highlight: hasMarket && l.price < market ? "💰 Priced below market" : null,
  };
}
