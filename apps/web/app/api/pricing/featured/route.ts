import { NextRequest, NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import { getFeaturedPlacementQuote } from "@/modules/monetization/dynamic-market-pricing.service";

export const dynamic = "force-dynamic";

/** GET — premium placement quote for a city (CAD). Query: city=, refresh=1, record=0 */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const city = sp.get("city")?.trim() || undefined;
    const refreshFactors = sp.get("refresh") === "1";
    const recordEvent = sp.get("record") !== "0";

    const quote = await getFeaturedPlacementQuote({ city, refreshFactors, recordEvent });

    return NextResponse.json({
      ok: true,
      ...quote,
      disclaimers: ["High-demand cities raise placement fees gradually within min/max bands."],
    });
  } catch (e) {
    logError("[api.pricing.featured]", { error: e });
    return NextResponse.json({ error: "Failed to compute quote" }, { status: 500 });
  }
}
