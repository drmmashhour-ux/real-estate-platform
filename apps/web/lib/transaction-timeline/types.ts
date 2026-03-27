/**
 * Transaction Timeline Engine – types and constants.
 */

export const TIMELINE_STAGES = [
  "listing_live",
  "offer_submitted",
  "negotiation",
  "offer_accepted",
  "deposit_pending",
  "deposit_received",
  "inspection_pending",
  "inspection_completed",
  "financing_pending",
  "financing_confirmed",
  "legal_documents_prepared",
  "notary_review",
  "closing_scheduled",
  "closing_completed",
  "cancelled",
] as const;
export type TimelineStage = (typeof TIMELINE_STAGES)[number];

export const STEP_STATUSES = ["pending", "in_progress", "completed", "blocked", "cancelled", "overdue"] as const;
export type StepStatus = (typeof STEP_STATUSES)[number];

export const ASSIGNED_ROLES = ["buyer", "seller", "broker", "admin", "notary", "compliance", "system"] as const;
export type AssignedRole = (typeof ASSIGNED_ROLES)[number];

export const TIMELINE_STATUSES = ["active", "blocked", "completed", "cancelled"] as const;
export type TimelineStatus = (typeof TIMELINE_STATUSES)[number];

export const EVENT_TYPES = [
  "timeline_created",
  "offer_submitted",
  "offer_countered",
  "offer_accepted",
  "offer_rejected",
  "offer_expired",
  "deposit_received",
  "inspection_completed",
  "inspection_waived",
  "financing_approved",
  "financing_denied",
  "financing_waived",
  "documents_generated",
  "notary_assigned",
  "closing_scheduled",
  "closing_completed",
  "transaction_cancelled",
  "stage_changed",
  "step_completed",
  "step_blocked",
] as const;
export type TimelineEventType = (typeof EVENT_TYPES)[number];

export interface StepDefinition {
  stepCode: string;
  stepName: string;
  stageName: string;
  defaultAssignedRole: AssignedRole;
}
