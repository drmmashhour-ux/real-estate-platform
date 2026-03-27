import type { MarketDataProvider } from "../domain/marketDataProvider";

/** ATTOM property enrichment — U.S. flows; disabled until API key present. */
export function createAttomAdapter(): MarketDataProvider {
  return {
    id: "attom",
    isAvailable() {
      return Boolean(process.env.ATTOM_API_KEY?.trim());
    },
    async getPropertyDetails() {
      return null;
    },
  };
}
