export type LegalDocumentStatus =
  | "draft"
  | "in_review"
  | "needs_changes"
  | "approved"
  | "finalized"
  | "exported"
  | "signed";

export type SignatureStatus = "pending" | "viewed" | "signed" | "declined";

export type WorkflowTransitionInput = {
  documentId: string;
  actorUserId: string;
  nextStatus: LegalDocumentStatus;
  metadata?: Record<string, unknown>;
};
