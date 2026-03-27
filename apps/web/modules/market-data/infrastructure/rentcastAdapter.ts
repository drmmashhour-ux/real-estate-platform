import type { MarketDataProvider } from "../domain/marketDataProvider";

/** RentCast rent / comp estimates — U.S.; disabled until API key present. */
export function createRentcastAdapter(): MarketDataProvider {
  return {
    id: "rentcast",
    isAvailable() {
      return Boolean(process.env.RENTCAST_API_KEY?.trim());
    },
    async getRentEstimate() {
      return null;
    },
  };
}
