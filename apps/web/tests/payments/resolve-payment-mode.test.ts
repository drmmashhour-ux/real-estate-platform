import { describe, expect, it } from "vitest";
import { buildPaymentResolutionContext, resolveActivePaymentModeFromMarket } from "@/lib/payments/resolve-payment-mode";
import type { ResolvedMarket } from "@/lib/markets/types";

function market(partial: Partial<ResolvedMarket>): ResolvedMarket {
  return {
    code: "default",
    defaultCurrency: "CAD",
    onlinePaymentsEnabled: true,
    manualPaymentTrackingEnabled: false,
    contactFirstEmphasis: false,
    bookingMode: "standard",
    paymentMode: "online",
    contactDisplayMode: "standard",
    suggestedDefaultLocale: "en",
    legalDisclaimerMessageKey: "legal.shortDisclaimer",
    ...partial,
  };
}

describe("resolveActivePaymentModeFromMarket", () => {
  it("returns manual when online disabled", () => {
    expect(resolveActivePaymentModeFromMarket(market({ onlinePaymentsEnabled: false }))).toBe("manual");
  });

  it("returns online when enabled", () => {
    expect(resolveActivePaymentModeFromMarket(market({ onlinePaymentsEnabled: true }))).toBe("online");
  });
});

describe("buildPaymentResolutionContext", () => {
  it("maps manual_first to request booking mode", () => {
    const ctx = buildPaymentResolutionContext(market({ bookingMode: "manual_first", onlinePaymentsEnabled: false }));
    expect(ctx.bookingMode).toBe("request");
    expect(ctx.paymentMode).toBe("manual");
  });
});
