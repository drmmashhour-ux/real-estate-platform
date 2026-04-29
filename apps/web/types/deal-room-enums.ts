/** Deal room workflows — enums mirrored from Prisma for client bundles. */

export type DealRoomStage =
  | "new_interest"
  | "qualified"
  | "visit_scheduled"
  | "visit_completed"
  | "offer_preparing"
  | "offer_submitted"
  | "negotiating"
  | "accepted"
  | "documents_pending"
  | "payment_pending"
  | "closed"
  | "lost";

export type DealPriorityLabel = "low" | "medium" | "high";

export type DealTaskStatus = "todo" | "in_progress" | "done" | "blocked";

export type DealDocumentStatus = "requested" | "in_progress" | "review_required" | "completed";

/** Payment row on deal room detail UIs. */
export type DealPaymentStatus = "pending" | "paid" | "failed" | "waived";
