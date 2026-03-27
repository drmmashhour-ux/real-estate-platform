/**
 * Property Digital Identity: constants and enums.
 */

export const LISTING_TYPES = ["sale", "long_term_rental", "short_term_rental"] as const;
export type ListingType = (typeof LISTING_TYPES)[number];

export const LINK_STATUSES = ["pending", "active", "rejected", "archived"] as const;
export type LinkStatus = (typeof LINK_STATUSES)[number];

export const VERIFICATION_TYPES = [
  "cadastre_check",
  "land_registry_document",
  "identity_match",
  "broker_license_check",
  "broker_authorization_check",
  "geo_validation",
  "anti_fraud_check",
] as const;
export type VerificationType = (typeof VERIFICATION_TYPES)[number];

export const VERIFICATION_STATUSES = ["pending", "verified", "rejected"] as const;
export type VerificationStatusValue = (typeof VERIFICATION_STATUSES)[number];

export const OWNER_SOURCES = ["land_registry_extract", "manual_admin_review", "broker_authorization"] as const;
export type OwnerSource = (typeof OWNER_SOURCES)[number];

export const RISK_LEVELS = ["low", "medium", "high"] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

export const EVENT_TYPES = [
  "identity_created",
  "listing_linked",
  "listing_rejected",
  "listing_unlinked",
  "verification_completed",
  "fraud_flag_added",
  "ownership_changed",
  "manual_review_requested",
  "risk_updated",
] as const;
export type EventType = (typeof EVENT_TYPES)[number];

/** Duplicate prevention outcome for a listing attempt. */
export const DUPLICATE_OUTCOMES = ["allowed", "blocked", "manual_review_required"] as const;
export type DuplicateOutcome = (typeof DUPLICATE_OUTCOMES)[number];

/** Verification score weights (total 100). */
export const VERIFICATION_WEIGHTS = {
  cadastre_verified: 30,
  land_registry_document_verified: 25,
  owner_identity_match: 20,
  geo_validation: 10,
  broker_license_valid: 5,
  broker_authorization_valid: 10,
} as const;

/** Score thresholds for verification level. */
export const VERIFICATION_THRESHOLDS = {
  insufficient: { min: 0, max: 49 },
  partial: { min: 50, max: 79 },
  strong: { min: 80, max: 100 },
} as const;
