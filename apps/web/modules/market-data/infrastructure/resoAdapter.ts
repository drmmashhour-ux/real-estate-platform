import type { MarketDataProvider } from "../domain/marketDataProvider";

/**
 * RESO Web API adapter — wire credentials via env when available; returns null until configured.
 */
export function createResoAdapter(): MarketDataProvider {
  return {
    id: "reso",
    isAvailable() {
      return Boolean(process.env.RESO_BASE_URL?.trim() && process.env.RESO_ACCESS_TOKEN?.trim());
    },
    async getPropertyDetails() {
      return null;
    },
    async getComparables() {
      return [];
    },
  };
}
