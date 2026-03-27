import { NextResponse } from "next/server";
import { getCachedMinimalProductInsights } from "@/lib/insights/product-insights-minimal";

export const dynamic = "force-dynamic";

/**
 * Public aggregate snapshot for adaptive UX (no PII).
 * Cached 5 minutes server-side + CDN-friendly headers.
 */
export async function GET() {
  try {
    const payload = await getCachedMinimalProductInsights();
    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (e) {
    console.error("[product-insights/snapshot]", e);
    return NextResponse.json(
      {
        analyzeToSaveRate: null,
        eventFunnelConversionPct: null,
        avgDealsPerUser: 0,
        totalUsers: 0,
        analyzeEvents: 0,
        saveEvents: 0,
        compareEvents: 0,
        compareUsageLow: false,
      },
      { status: 200 }
    );
  }
}
