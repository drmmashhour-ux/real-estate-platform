import type { LocaleCode } from "@/lib/i18n/types";
import type { ResolvedMarket } from "./types";

/**
 * Spec-aligned view over `ResolvedMarket` (internal model stays stable).
 * `bookingMode` maps: `standard` → instant-capable checkout; `manual_first` → request / host confirm path.
 */
export type MarketConfigView = {
  code: string;
  defaultLocale: LocaleCode;
  supportedLocales: LocaleCode[];
  currency: string;
  bookingMode: "instant" | "request";
  paymentMode: "online" | "manual" | "mixed";
  contactMode: "normal" | "contact-first";
  onlinePaymentsEnabled: boolean;
  manualPaymentTrackingEnabled: boolean;
  legalCopyKeyPrefix: "legal" | "market";
  featureFlags: {
    contactFirst: boolean;
    requestBooking: boolean;
    manualPayments: boolean;
  };
};

export function toMarketConfigView(m: ResolvedMarket): MarketConfigView {
  const defaultLocale: LocaleCode =
    m.suggestedDefaultLocale === "ar" ? "ar" : m.suggestedDefaultLocale === "fr" ? "fr" : "en";
  const supportedLocales: LocaleCode[] =
    m.code === "syria" ? ["en", "ar", "fr"] : ["en", "fr", "ar"];
  return {
    code: m.code,
    defaultLocale,
    supportedLocales,
    currency: m.defaultCurrency,
    bookingMode: m.bookingMode === "standard" ? "instant" : "request",
    paymentMode: m.paymentMode,
    contactMode: m.contactDisplayMode === "emphasized" ? "contact-first" : "normal",
    onlinePaymentsEnabled: m.onlinePaymentsEnabled,
    manualPaymentTrackingEnabled: m.manualPaymentTrackingEnabled,
    legalCopyKeyPrefix: m.code === "syria" ? "market" : "legal",
    featureFlags: {
      contactFirst: m.contactFirstEmphasis,
      requestBooking: m.bookingMode !== "standard",
      manualPayments: m.paymentMode !== "online",
    },
  };
}
