import type { OtaChannelAdapter } from "./types";

/** Placeholder — wire Airbnb API / partner program when approved. */
export function createAirbnbAdapter(): OtaChannelAdapter {
  return {
    platformId: "airbnb",
    async validateSetup() {
      return { ok: false, message: "Airbnb API connector not configured" };
    },
    async fetchReservations() {
      return [];
    },
    async pushAvailability() {
      return { ok: false, message: "Not implemented — use iCal for MVP" };
    },
    async updateRates() {
      return { ok: false, message: "Not implemented" };
    },
    async cancelReservation() {
      return { ok: false, message: "Not implemented" };
    },
    async syncStatus() {
      return null;
    },
  };
}
