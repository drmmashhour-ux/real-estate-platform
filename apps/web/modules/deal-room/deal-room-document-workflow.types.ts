/**
 * Deal room document workflow — operational checklists, not e-sign or closing.
 */

export type DealRoomDocumentCategory =
  | "identity"
  | "property"
  | "offer"
  | "broker"
  | "financial"
  | "support"
  | "other";

export type DealRoomDocumentWorkflowStatus =
  | "missing"
  | "requested"
  | "received"
  | "under_review"
  | "approved"
  | "rejected"
  | "expired";

/** Alias — requirement lifecycle status (distinct from informal “document rows” elsewhere). */
export type DealRoomDocumentStatus = DealRoomDocumentWorkflowStatus;

export type DealRoomDocumentRequirement = {
  id: string;
  dealRoomId: string;
  title: string;
  category: DealRoomDocumentCategory;
  /** Whether this row counts toward packet completeness gates */
  required: boolean;
  status: DealRoomDocumentWorkflowStatus;
  notes?: string;
  /** Links to existing `DealRoomDocument.id` when attached */
  attachedDocumentId?: string;
  /** When true, row may appear on client portal (still requires participant portal + capability) */
  portalShared?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type DealRoomDocumentPacketSummary = {
  totalRequired: number;
  receivedCount: number;
  approvedCount: number;
  missingCount: number;
  /** 0–1; 0 when totalRequired is 0 */
  completionRate: number;
};
