/**
 * Future OTA API surface — implement per partner; do not fake live bookings.
 */
export type OtaReservation = {
  externalId: string;
  checkIn: string;
  checkOut: string;
  guestName?: string;
  status: "confirmed" | "cancelled" | "pending";
};

export type OtaAvailabilityPush = {
  listingExternalRef: string;
  /** ISO date → closed or price/min-stay (future) */
  closedDates: string[];
};

export interface OtaChannelAdapter {
  readonly platformId: string;
  validateSetup(): Promise<{ ok: boolean; message?: string }>;
  fetchReservations(params: { externalListingRef: string; since?: Date }): Promise<OtaReservation[]>;
  pushAvailability(params: OtaAvailabilityPush): Promise<{ ok: boolean; message?: string }>;
  updateRates(_params: { externalListingRef: string; nightlyByDate: Record<string, number> }): Promise<{
    ok: boolean;
    message?: string;
  }>;
  cancelReservation(_externalReservationId: string): Promise<{ ok: boolean; message?: string }>;
  syncStatus(_externalReservationId: string): Promise<{ status: string } | null>;
}
