import type { BnhubTravelConnector } from "./travelConnectorTypes";

const notLive = "Partner-managed inventory is not live on BNHub yet — request-only or coming soon.";

function stub(key: string): BnhubTravelConnector {
  return {
    key,
    async validateSetup() {
      return { ok: false, message: notLive };
    },
    async searchProducts() {
      return { items: [], disclaimer: notLive };
    },
    async getQuote() {
      return { quoteCents: null, currency: "USD", disclaimer: notLive };
    },
    async reserve() {
      return { ok: false, reason: notLive };
    },
    async cancel() {
      return { ok: false, reason: notLive };
    },
    async syncStatus() {
      return { status: "unavailable", disclaimer: notLive };
    },
  };
}

export const hotelInventoryConnector = stub("hotel");
export const airportTransferConnector = stub("airport_transfer");
export const activityTourConnector = stub("activity");
export const flightTravelConnector = stub("flight");
export const conciergePartnerConnector = stub("concierge_partner");
