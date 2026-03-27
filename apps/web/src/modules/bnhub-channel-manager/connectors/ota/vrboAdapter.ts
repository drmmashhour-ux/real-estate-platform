import type { OtaChannelAdapter } from "./types";

/** Placeholder — Vrbo / Expedia Group API. */
export function createVrboAdapter(): OtaChannelAdapter {
  return {
    platformId: "vrbo",
    async validateSetup() {
      return { ok: false, message: "Vrbo API connector not configured" };
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
