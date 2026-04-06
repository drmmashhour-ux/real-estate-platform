import type { ResolvedMarket } from "@/lib/markets/types";
import type { MarketContentConstraints } from "./types";

export function toMarketContentConstraints(m: ResolvedMarket): MarketContentConstraints {
  return {
    marketCode: m.code,
    contactFirst: Boolean(m.contactFirstEmphasis),
    manualPaymentEmphasis: m.paymentMode === "manual" || m.bookingMode === "manual_first",
    onlinePaymentsEnabled: m.onlinePaymentsEnabled,
  };
}
