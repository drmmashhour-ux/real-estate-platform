/** Lender pipeline statuses (ordered). */
export const LENDER_STATUSES = [
  "TARGET",
  "CONTACTED",
  "PACKAGE_SENT",
  "OFFER_RECEIVED",
  "SELECTED",
  "REJECTED",
] as const;

export type LenderStatus = (typeof LENDER_STATUSES)[number];

export const OFFER_STATUSES = ["RECEIVED", "NEGOTIATING", "ACCEPTED", "REJECTED"] as const;
export type OfferStatus = (typeof OFFER_STATUSES)[number];

export type ClosingReadinessLabel = "READY" | "CONDITIONAL" | "BLOCKED";

export type ClosingBlocker = {
  code: string;
  message: string;
  severity: "CRITICAL" | "WARNING";
};

export type OfferComparisonRow = {
  offerId: string;
  lenderId: string;
  lenderName: string;
  offeredAmount: number;
  interestRate: number;
  termYears: number | null;
  amortizationYears: number | null;
  score: number;
};
