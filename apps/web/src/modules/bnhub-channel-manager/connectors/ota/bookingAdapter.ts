import type { OtaChannelAdapter } from "./types";

/** Placeholder — Booking.com Connectivity API. */
export function createBookingComAdapter(): OtaChannelAdapter {
  return {
    platformId: "booking_com",
    async validateSetup() {
      return { ok: false, message: "Booking.com API connector not configured" };
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
