import type { ResolvedMarket } from "./types";

/** Syria soft-launch profile: manual-first booking, offline payment tracking, contact-first UX. */
export const syriaMarketDefinition: ResolvedMarket = {
  code: "syria",
  defaultCurrency: "SYP",
  paymentMode: "manual",
  bookingMode: "manual_first",
  contactDisplayMode: "emphasized",
  onlinePaymentsEnabled: false,
  manualPaymentTrackingEnabled: true,
  contactFirstEmphasis: true,
  suggestedDefaultLocale: "ar",
  legalDisclaimerMessageKey: "legal.shortDisclaimer",
};
