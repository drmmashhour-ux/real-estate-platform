/**
 * Static market catalog for docs, tests, and synchronous UI hints.
 * Live booking/payment behavior uses `getResolvedMarket()` (DB + admin settings).
 */

export type BookingMode = "instant" | "request";

export type PaymentMode = "online" | "manual";

export type ContactMode = "normal" | "contact-first";

export interface MarketConfig {
  code: string;
  currency: string;
  bookingMode: BookingMode;
  paymentMode: PaymentMode;
  contactMode: ContactMode;
  onlinePaymentsEnabled: boolean;
}

export const defaultMarket: MarketConfig = {
  code: "global",
  currency: "CAD",
  bookingMode: "instant",
  paymentMode: "online",
  contactMode: "normal",
  onlinePaymentsEnabled: true,
};

export const syriaMarket: MarketConfig = {
  code: "syria",
  currency: "SYP",
  bookingMode: "request",
  paymentMode: "manual",
  contactMode: "contact-first",
  onlinePaymentsEnabled: false,
};

export function getMarketConfig(code?: string | null): MarketConfig {
  const c = code?.trim().toLowerCase();
  if (c === "syria") return syriaMarket;
  return defaultMarket;
}
