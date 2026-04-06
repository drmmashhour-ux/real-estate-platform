import type { ResolvedMarket } from "./types";

export const defaultMarketDefinition: ResolvedMarket = {
  code: "default",
  defaultCurrency: "USD",
  paymentMode: "online",
  bookingMode: "standard",
  contactDisplayMode: "standard",
  onlinePaymentsEnabled: true,
  manualPaymentTrackingEnabled: true,
  contactFirstEmphasis: false,
  suggestedDefaultLocale: "en",
  legalDisclaimerMessageKey: "legal.shortDisclaimer",
};
