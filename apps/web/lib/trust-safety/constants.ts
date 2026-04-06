/**
 * Trust & Safety: fraud response and dispute resolution constants.
 */

export const ACCOUNT_STATUSES = ["ACTIVE", "RESTRICTED", "SUSPENDED", "BANNED"] as const;
export type AccountStatusValue = (typeof ACCOUNT_STATUSES)[number];

/** Listing statuses that hide from public and block bookings */
export const FRAUD_LISTING_STATUSES = [
  "UNDER_INVESTIGATION",
  "FROZEN",
  "REJECTED_FOR_FRAUD",
  "PERMANENTLY_REMOVED",
  "SUSPENDED",
] as const;

export const PAYOUT_HOLD_REASONS = [
  "fraud_investigation",
  "dispute",
  "escrow_window",
  "safety_complaint",
  "service_mismatch",
  "dispute_escalation",
] as const;
export type PayoutHoldReason = (typeof PAYOUT_HOLD_REASONS)[number];

export const PAYOUT_HOLD_STATUSES = [
  "PENDING",
  "ON_HOLD",
  "RELEASABLE",
  "RELEASED",
  "REVERSED",
  "REFUNDED",
] as const;

export const DISPUTE_COMPLAINT_CATEGORIES = [
  "property_not_as_described",
  "cleanliness_issue",
  "missing_amenities",
  "checkin_problem",
  "unsafe",
  "misleading_photos",
  "host_unresponsive",
  "other",
] as const;
export type ComplaintCategory = (typeof DISPUTE_COMPLAINT_CATEGORIES)[number];

export const DISPUTE_RESOLUTION_OUTCOMES = [
  "partial_refund",
  "full_refund",
  "cancel_booking",
  "no_action",
  "host_suspended",
  "host_warning",
  "guest_relocation",
] as const;
export type ResolutionOutcome = (typeof DISPUTE_RESOLUTION_OUTCOMES)[number];

export const DISPUTE_URGENCY_LEVELS = ["normal", "high", "urgent"] as const;
export type UrgencyLevel = (typeof DISPUTE_URGENCY_LEVELS)[number];

/** Unsafe conditions get urgent priority and immediate payout freeze */
export const UNSAFE_COMPLAINT_CATEGORIES = ["unsafe", "checkin_problem"] as const;

export const FRAUD_REASON_CODES = [
  "fake_owner",
  "unauthorized_broker",
  "fake_property",
  "duplicate_cadastre",
  "manipulated_document",
  "false_address",
  "stolen_photos",
  "property_not_owned",
  "other",
] as const;

export const ENFORCEMENT_REASON_CODES = [
  "FRAUD_CONFIRMED",
  "DOCUMENTS_INVALID",
  "IDENTITY_MISMATCH",
  "DUPLICATE_LISTING",
  "REPEATED_FRAUD",
  "POLICY_VIOLATION",
  "OTHER",
] as const;

/** Guest must report issue within this many hours of check-in */
export const DISPUTE_REPORT_WINDOW_HOURS = 24;

/** Default ~10 days; override with `BNHUB_ESCROW_RELEASE_HOURS_AFTER_CHECKIN` (e.g. 168–336 for 7–14d). */
export const ESCROW_RELEASE_HOURS_AFTER_CHECKIN_DEFAULT = 240;

export function getEscrowReleaseHoursAfterCheckin(): number {
  const raw = process.env.BNHUB_ESCROW_RELEASE_HOURS_AFTER_CHECKIN?.trim();
  if (!raw) return ESCROW_RELEASE_HOURS_AFTER_CHECKIN_DEFAULT;
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 24) return ESCROW_RELEASE_HOURS_AFTER_CHECKIN_DEFAULT;
  return Math.min(504, n); // cap 21d
}

/** @deprecated Use `getEscrowReleaseHoursAfterCheckin()` */
export const ESCROW_RELEASE_HOURS_AFTER_CHECKIN = ESCROW_RELEASE_HOURS_AFTER_CHECKIN_DEFAULT;

/** Host must respond to dispute within this many hours */
export const HOST_RESPONSE_DEADLINE_HOURS = 48;
