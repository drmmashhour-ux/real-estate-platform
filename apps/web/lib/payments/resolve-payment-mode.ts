import type { ResolvedMarket } from "@/lib/markets/types";
import type { ActivePaymentMode, PaymentResolutionContext } from "./types";

/** Collapse `mixed` markets to the dominant rail for gating Stripe checkout creation. */
export function resolveActivePaymentModeFromMarket(m: ResolvedMarket): ActivePaymentMode {
  if (!m.onlinePaymentsEnabled) return "manual";
  if (m.paymentMode === "manual") return "manual";
  return "online";
}

export function buildPaymentResolutionContext(m: ResolvedMarket): PaymentResolutionContext {
  const bookingMode: "instant" | "request" = m.bookingMode === "manual_first" ? "request" : "instant";
  return {
    marketCode: m.code,
    bookingMode,
    paymentMode: resolveActivePaymentModeFromMarket(m),
  };
}
