/**
 * Reusable condition / notice tracking (drafting-book style).
 * Persist in DB per entity when you add a model; types are stable for APIs and UI.
 */

export type ConditionStatus = "pending" | "satisfied" | "waived" | "failed";

export type TransactionCondition = {
  id: string;
  name: string;
  dueDate: string | null;
  status: ConditionStatus;
  writtenNoticeSentAt: string | null;
  evidenceDocumentIds: string[];
  notes: string | null;
  updatedAt: string;
};

export type ConditionCategory =
  | "inspection"
  | "financing"
  | "document_review"
  | "seller_correction"
  | "host_correction"
  | "booking_modification"
  | "other";

export function emptyConditionTemplate(partial: {
  id: string;
  name: string;
  category?: ConditionCategory;
}): TransactionCondition {
  return {
    id: partial.id,
    name: partial.name,
    dueDate: null,
    status: "pending",
    writtenNoticeSentAt: null,
    evidenceDocumentIds: [],
    notes: null,
    updatedAt: new Date().toISOString(),
  };
}
