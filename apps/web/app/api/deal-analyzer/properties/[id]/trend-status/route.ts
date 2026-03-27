import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { assertFsboListingAccessibleForPhase3 } from "@/lib/deal-analyzer/phase3ListingAccess";
import { isDealAnalyzerEnabled } from "@/modules/deal-analyzer/config";
import { getMarketTrendForListing } from "@/modules/market-trends/application/getMarketTrendForListing";

export const dynamic = "force-dynamic";

const WINDOWS = new Set([30, 90, 180]);

/** GET /api/deal-analyzer/properties/[id]/trend-status */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!isDealAnalyzerEnabled()) {
    return NextResponse.json({ error: "Deal Analyzer disabled" }, { status: 503 });
  }

  const { id } = await context.params;
  const userId = await getGuestId();
  const gate = await assertFsboListingAccessibleForPhase3(id, userId);
  if (!gate.ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const windowRaw = Number(request.nextUrl.searchParams.get("windowDays")) || 90;
  if (!WINDOWS.has(windowRaw)) {
    return NextResponse.json({ error: "windowDays must be 30, 90, or 180" }, { status: 400 });
  }

  const trend = await getMarketTrendForListing(id, { windowDays: windowRaw as 30 | 90 | 180 });
  if (!trend) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    propertyId: id,
    windowDays: windowRaw,
    summary: trend.summary,
    newerSnapshot: trend.newerSnapshot,
    olderSnapshot: trend.olderSnapshot,
    disclaimer: "Trend signals are not appraisals and do not guarantee future prices or returns.",
  });
}
