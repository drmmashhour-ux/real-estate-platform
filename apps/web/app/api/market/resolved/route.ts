import { getResolvedMarket } from "@/lib/markets";

/** GET /api/market/resolved — public market flags for client UX (no secrets). */
export async function GET() {
  const m = await getResolvedMarket();
  return Response.json({
    code: m.code,
    defaultCurrency: m.defaultCurrency,
    paymentMode: m.paymentMode,
    bookingMode: m.bookingMode,
    contactDisplayMode: m.contactDisplayMode,
    onlinePaymentsEnabled: m.onlinePaymentsEnabled,
    manualPaymentTrackingEnabled: m.manualPaymentTrackingEnabled,
    contactFirstEmphasis: m.contactFirstEmphasis,
    suggestedDefaultLocale: m.suggestedDefaultLocale,
    legalDisclaimerMessageKey: m.legalDisclaimerMessageKey,
  });
}
