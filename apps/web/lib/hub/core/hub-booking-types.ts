/**
 * Generic booking lifecycle contracts — adapters map domain specifics.
 */

export type HubBookingStatus =
  | "draft"
  | "pending_payment"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "disputed";

export type HubQuoteRequest = {
  hubKey: string;
  entityId: string;
  /** Opaque window — BNHub: checkIn/checkOut ISO; CarHub: pickup/return */
  window: Record<string, string>;
  guestCount?: number;
  metadata?: Record<string, unknown>;
};

export type HubQuoteResult =
  | { ok: true; totalCents: number; currency: string; breakdown: Record<string, unknown> }
  | { ok: false; error: string };

export type HubAvailabilityRequest = {
  hubKey: string;
  entityId: string;
  window: Record<string, string>;
};

export type HubAvailabilityResult =
  | { ok: true; available: boolean; reason?: string }
  | { ok: false; error: string };

export type HubReservationCreateRequest = {
  hubKey: string;
  entityId: string;
  guestUserId: string;
  window: Record<string, string>;
  metadata?: Record<string, unknown>;
};

export type HubReservationCreateResult =
  | { ok: true; reservationId: string }
  | { ok: false; error: string };

export type HubReservationTransitionRequest = {
  hubKey: string;
  reservationId: string;
  toStatus: HubBookingStatus;
  actorUserId: string;
  reason?: string;
};

export type HubBookingEngine = {
  computeQuote(req: HubQuoteRequest): Promise<HubQuoteResult>;
  validateAvailability(req: HubAvailabilityRequest): Promise<HubAvailabilityResult>;
  createReservation(req: HubReservationCreateRequest): Promise<HubReservationCreateResult>;
  transitionReservationStatus(req: HubReservationTransitionRequest): Promise<{ ok: boolean; error?: string }>;
};
