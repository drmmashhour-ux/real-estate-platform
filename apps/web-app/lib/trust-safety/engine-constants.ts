/**
 * Trust & Safety Engine: incident categories, severity, risk levels, action reason codes.
 */

export const INCIDENT_CATEGORIES = [
  "unsafe_property",
  "property_not_as_described",
  "harassment",
  "abusive_behavior",
  "unauthorized_party",
  "illegal_activity",
  "host_unresponsive",
  "guest_misconduct",
  "discrimination_report",
  "deceptive_listing_behavior",
  "review_abuse",
  "message_abuse",
  "payment_or_extortion_related_issue",
  "other",
] as const;

export type IncidentCategory = (typeof INCIDENT_CATEGORIES)[number];

export const SEVERITY_LEVELS = ["LOW", "MEDIUM", "HIGH", "EMERGENCY"] as const;
export type SeverityLevel = (typeof SEVERITY_LEVELS)[number];

export const RISK_LEVELS = ["LOW_RISK", "MEDIUM_RISK", "HIGH_RISK", "CRITICAL_RISK"] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

export const URGENCY_LEVELS = ["normal", "high", "urgent", "emergency"] as const;
export type UrgencyLevel = (typeof URGENCY_LEVELS)[number];

/** Categories that trigger emergency or high severity by default */
export const HIGH_SEVERITY_CATEGORIES: IncidentCategory[] = [
  "unsafe_property",
  "harassment",
  "illegal_activity",
  "abusive_behavior",
  "discrimination_report",
];

export const EMERGENCY_CATEGORIES: IncidentCategory[] = [
  "unsafe_property",
  "illegal_activity",
  "harassment",
];

export const INCIDENT_STATUSES = ["SUBMITTED", "UNDER_REVIEW", "WAITING_RESPONSE", "ESCALATED", "RESOLVED", "CLOSED"] as const;

export const TRUST_SAFETY_ACTION_TYPES = [
  "WARNING",
  "LISTING_WARNING",
  "BOOKING_RESTRICTION",
  "PAYOUT_HOLD",
  "LISTING_FREEZE",
  "ACCOUNT_SUSPENSION",
  "PERMANENT_LISTING_REMOVAL",
  "PERMANENT_ACCOUNT_BAN",
  "ADDITIONAL_VERIFICATION_REQUIRED",
  "MANUAL_REVIEW_REQUIRED",
] as const;

export const ACTION_REASON_CODES = [
  "UNSAFE_PROPERTY",
  "HARASSMENT",
  "PARTY_VIOLATION",
  "FRAUD",
  "MISCONDUCT",
  "REVIEW_ABUSE",
  "MESSAGE_ABUSE",
  "POLICY_VIOLATION",
  "REPEATED_VIOLATIONS",
  "ILLEGAL_ACTIVITY",
  "OTHER",
] as const;

export const EVIDENCE_FILE_TYPES = ["photo", "video", "screenshot", "document"] as const;
