export { OFFER_TO_PURCHASE_TEMPLATE } from "./offer-to-purchase";
export { RENTAL_AGREEMENT_TEMPLATE } from "./rental-agreement";
export { BROKER_LISTING_AGREEMENT_TEMPLATE } from "./broker-listing-agreement";
export { BOOKING_CONFIRMATION_TEMPLATE } from "./booking-confirmation";
export { VERIFICATION_REPORT_TEMPLATE } from "./verification-report";
export { INVESTMENT_REPORT_TEMPLATE } from "./investment-report";
export { TRANSACTION_SUMMARY_TEMPLATE } from "./transaction-summary";
export { DISPUTE_REPORT_TEMPLATE } from "./dispute-report";

export const DOCUMENT_TYPES = [
  "offer",
  "rental_agreement",
  "broker_agreement",
  "booking_confirmation",
  "verification_report",
  "investment_report",
  "transaction_summary",
  "dispute_report",
] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];
