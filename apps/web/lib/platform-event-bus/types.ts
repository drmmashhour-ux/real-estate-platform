/**
 * Platform Event Bus – event types and payload shapes.
 */

// Property events
export const PROPERTY_EVENTS = [
  "property_created",
  "property_verified",
  "property_updated",
  "property_sold",
  "property_closed",
] as const;

// Identity events
export const IDENTITY_EVENTS = [
  "owner_verified",
  "broker_verified",
  "identity_flagged",
] as const;

// Transaction events
export const TRANSACTION_EVENTS = [
  "offer_created",
  "offer_accepted",
  "inspection_completed",
  "financing_confirmed",
  "legal_documents_prepared",
  "closing_scheduled",
  "transaction_closed",
] as const;

// BNHub events
export const BNHUB_EVENTS = [
  "rental_booking_created",
  "rental_payment_received",
  "rental_completed",
] as const;

// Fraud events
export const FRAUD_EVENTS = [
  "fraud_detected",
  "trust_score_updated",
  "listing_flagged",
] as const;

// AI events
export const AI_EVENTS = [
  "valuation_generated",
  "pricing_recommended",
  "investment_opportunity_detected",
  "transaction_risk_alert",
] as const;

export const PLATFORM_EVENT_TYPES = [
  ...PROPERTY_EVENTS,
  ...IDENTITY_EVENTS,
  ...TRANSACTION_EVENTS,
  ...BNHUB_EVENTS,
  ...FRAUD_EVENTS,
  ...AI_EVENTS,
] as const;

export type PlatformEventType = (typeof PLATFORM_EVENT_TYPES)[number];

export const PROCESSING_STATUSES = ["pending", "processed", "failed", "dead"] as const;
export type ProcessingStatus = (typeof PROCESSING_STATUSES)[number];

export interface PlatformEventPayload {
  [key: string]: unknown;
}

export interface PublishOptions {
  sourceModule: string;
  entityType?: string;
  entityId?: string;
  region?: string;
  payload?: PlatformEventPayload;
}

export interface StoredPlatformEvent {
  id: string;
  eventType: string;
  sourceModule: string;
  entityType: string | null;
  entityId: string | null;
  payload: unknown;
  region: string | null;
  processingStatus: string;
  processedAt: Date | null;
  errorMessage: string | null;
  createdAt: Date;
}

export type EventConsumer = (event: StoredPlatformEvent) => void | Promise<void>;
