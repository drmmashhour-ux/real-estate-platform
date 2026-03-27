/**
 * Notary and Closing Integration – types and constants.
 */

export const PACKAGE_STATUSES = [
  "draft",
  "ready",
  "notary_review",
  "closing_scheduled",
  "completed",
] as const;
export type PackageStatus = (typeof PACKAGE_STATUSES)[number];

export const CLOSING_DOCUMENT_TYPES = [
  "offer",
  "property_sheet",
  "buyer_info",
  "seller_info",
  "broker_details",
  "transaction_summary",
  "payment_summary",
  "ownership_verification",
  "broker_authorization",
] as const;
export type ClosingDocumentType = (typeof CLOSING_DOCUMENT_TYPES)[number];

export const CLOSING_WORKFLOW_STAGES = [
  "offer_submitted",
  "offer_accepted",
  "documents_prepared",
  "notary_review",
  "closing_scheduled",
  "closing_completed",
] as const;

export interface PaymentEscrowSummary {
  purchase_price: number; // cents
  deposit_amount: number; // cents
  remaining_balance: number; // cents
  escrow_status: string; // e.g. "deposit_received" | "pending" | "released"
  deposits_paid: number;
}

export interface ClosingPackageView {
  id: string;
  transactionId: string;
  packageStatus: string;
  generatedById: string;
  notaryId: string | null;
  createdAt: Date;
  documents: Array<{
    id: string;
    documentType: string;
    documentId: string;
    contentHtml: string | null;
    signatureFields: unknown;
  }>;
}
