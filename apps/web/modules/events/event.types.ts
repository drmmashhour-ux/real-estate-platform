/**
 * Append-only compliance timeline — domain types only (no logic).
 */

export type EventEntityType =
  | "document"
  | "workflow"
  | "listing"
  | "user"
  | "review"
  | "verification"
  | "legal_record";

export type EventType =
  // DOCUMENT
  | "document_uploaded"
  | "document_submitted"
  | "document_approved"
  | "document_rejected"
  // WORKFLOW
  | "workflow_created"
  | "workflow_submitted"
  | "workflow_under_review"
  | "workflow_approved"
  | "workflow_rejected"
  // REVIEW
  | "review_started"
  | "review_completed"
  // VERIFICATION
  | "verification_started"
  | "verification_completed"
  // LISTING / MARKET
  | "listing_created"
  | "listing_published"
  | "listing_blocked"
  | "listing_publish_blocked_compliance"
  | "listing_publish_allowed_compliance"
  | "compliance_evaluated"
  // LEGAL RECORD (metadata events — no document payloads)
  | "legal_record_uploaded"
  | "legal_record_parsed"
  | "legal_record_validated"
  | "legal_record_flagged"
  | "legal_record_rejected"
  // POLICY / GOVERNANCE (facts — not legal conclusions)
  | "action_blocked_by_policy"
  | "action_allowed";

/** Stored row shape (matches Prisma `EventRecord`). */
export type EventRecord = {
  id: string;
  entityType: EventEntityType;
  entityId: string;
  eventType: EventType;
  actorId?: string | null;
  actorType: string;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
};

/** Input for creating a new append-only row. */
export type EventRecordInput = {
  entityType: EventEntityType;
  entityId: string;
  eventType: EventType;
  actorId?: string | null;
  actorType: string;
  metadata?: Record<string, unknown> | null;
};
