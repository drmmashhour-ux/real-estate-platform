import { createAttomAdapter } from "../infrastructure/attomAdapter";
import { createRentcastAdapter } from "../infrastructure/rentcastAdapter";
import { createResoAdapter } from "../infrastructure/resoAdapter";
import type { MarketDataProvider } from "../domain/marketDataProvider";

/** Provider registry — scoring modules must not import adapters directly; use this from orchestration only. */
export function getMarketDataProviders(): MarketDataProvider[] {
  return [createResoAdapter(), createAttomAdapter(), createRentcastAdapter()];
}

export function availableMarketProviders(): MarketDataProvider[] {
  return getMarketDataProviders().filter((p) => p.isAvailable());
}
