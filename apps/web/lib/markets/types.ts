export type MarketCode = "default" | "syria";

export type BookingMode = "standard" | "manual_first";

export type ContactDisplayMode = "standard" | "emphasized";

export type PaymentMode = "online" | "manual" | "mixed";

export type ResolvedMarket = {
  code: MarketCode;
  /** ISO 4217 for display (listing/booking summaries). */
  defaultCurrency: string;
  paymentMode: PaymentMode;
  bookingMode: BookingMode;
  contactDisplayMode: ContactDisplayMode;
  onlinePaymentsEnabled: boolean;
  manualPaymentTrackingEnabled: boolean;
  contactFirstEmphasis: boolean;
  /** BCP 47 hint for onboarding defaults (UI still user-chosen). */
  suggestedDefaultLocale: string;
  legalDisclaimerMessageKey: string;
};
