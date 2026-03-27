import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isDealAnalyzerEnabled, isDealAnalyzerPricingAdvisorEnabled } from "@/modules/deal-analyzer/config";
import { getSellerPricingAdvisorDto } from "@/modules/deal-analyzer/application/getSellerPricingAdvisor";
import { assertFsboListingAccessibleForPhase3 } from "@/lib/deal-analyzer/phase3ListingAccess";
import { getMarketTrendForListing } from "@/modules/market-trends/application/getMarketTrendForListing";

export const dynamic = "force-dynamic";

/** Seller-oriented snapshot; still gated so non-public listings stay private. */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isDealAnalyzerEnabled() || !isDealAnalyzerPricingAdvisorEnabled()) {
    return NextResponse.json({ error: "Pricing advisor disabled" }, { status: 503 });
  }
  const { id } = await context.params;
  const userId = await getGuestId();
  const gate = await assertFsboListingAccessibleForPhase3(id, userId);
  if (!gate.ok) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [dto, marketTrend] = await Promise.all([
    getSellerPricingAdvisorDto(id),
    getMarketTrendForListing(id, { windowDays: 90 }).catch(() => null),
  ]);

  return NextResponse.json({
    pricingAdvisor: dto,
    marketTrend:
      marketTrend == null
        ? null
        : {
            summary: marketTrend.summary,
            newerSnapshot: marketTrend.newerSnapshot,
            olderSnapshot: marketTrend.olderSnapshot,
            disclaimer:
              "Trend signals are not appraisals and do not guarantee future prices or returns. Deterministic scores are unchanged.",
          },
  });
}
