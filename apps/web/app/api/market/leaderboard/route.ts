import { NextResponse } from "next/server";
import { getCitySummariesForLeaderboard } from "@/lib/market/data";

export const dynamic = "force-dynamic";

/** GET — ranked lists for investor dashboard (estimates). */
export async function GET() {
  try {
    const rows = await getCitySummariesForLeaderboard();

    const byGrowth = [...rows]
      .filter((r) => r.priceGrowth6mPercent != null)
      .sort((a, b) => (b.priceGrowth6mPercent ?? 0) - (a.priceGrowth6mPercent ?? 0));

    const byYield = [...rows]
      .filter((r) => r.rentYieldProxy != null)
      .sort((a, b) => (b.rentYieldProxy ?? 0) - (a.rentYieldProxy ?? 0));

    const trending = [...rows].filter((r) => r.trendLabel === "rising").slice(0, 10);

    return NextResponse.json({
      label: "estimate",
      bestByPriceGrowth6m: byGrowth.slice(0, 8),
      bestByRentYieldProxy: byYield.slice(0, 8),
      trendingRisingMarkets: trending,
      disclaimer:
        "Market trends and forecasts are estimates based on available data and are not guarantees of future performance.",
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load leaderboard" }, { status: 500 });
  }
}
