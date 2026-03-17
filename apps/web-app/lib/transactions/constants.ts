/**
 * Real Estate Transaction Engine: status values and constants.
 */

export const TRANSACTION_STATUSES = [
  "offer_submitted",
  "negotiation",
  "offer_accepted",
  "deposit_required",
  "deposit_received",
  "contract_signed",
  "closing_in_progress",
  "completed",
  "cancelled",
] as const;
export type TransactionStatus = (typeof TRANSACTION_STATUSES)[number];

export const OFFER_STATUSES = ["pending", "accepted", "rejected", "countered", "expired"] as const;
export type OfferStatus = (typeof OFFER_STATUSES)[number];

export const DEPOSIT_PAYMENT_STATUSES = ["pending", "paid", "refunded"] as const;
export type DepositPaymentStatus = (typeof DEPOSIT_PAYMENT_STATUSES)[number];

export const DOCUMENT_TYPES = [
  "purchase_agreement",
  "broker_agreement",
  "inspection_conditions",
  "disclosure",
  "amendments",
] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const CLOSING_STEP_NAMES = [
  "inspection",
  "financing_approval",
  "legal_review",
  "final_payment",
  "ownership_transfer",
] as const;
export type ClosingStepName = (typeof CLOSING_STEP_NAMES)[number];

export const TRANSACTION_EVENT_TYPES = [
  "offer_submitted",
  "offer_countered",
  "offer_accepted",
  "offer_rejected",
  "offer_expired",
  "deposit_paid",
  "deposit_refunded",
  "contract_signed",
  "step_completed",
  "transaction_closed",
  "transaction_cancelled",
] as const;
export type TransactionEventType = (typeof TRANSACTION_EVENT_TYPES)[number];
