import { NextRequest, NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import { getLeadPricingQuote } from "@/modules/monetization/dynamic-market-pricing.service";

export const dynamic = "force-dynamic";

/**
 * GET /api/pricing/lead — dynamic lead fee quote (CAD).
 * Query: leadId?, city?, refresh=1 (admin — force factor refresh), record=0 (skip analytics event).
 */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const leadId = sp.get("leadId")?.trim() || null;
    const city = sp.get("city")?.trim() || null;
    const refreshFactors = sp.get("refresh") === "1";
    const recordEvent = sp.get("record") !== "0";

    const quote = await getLeadPricingQuote({
      leadId,
      city,
      recordEvent,
      refreshFactors,
    });

    return NextResponse.json({
      ok: true,
      ...quote,
      disclaimers: [
        "Indicative platform fee for attribution — confirm in operator billing settings.",
        "High-quality leads use a modest multiplier; prices stay within published min/max.",
      ],
    });
  } catch (e) {
    logError("[api.pricing.lead]", { error: e });
    return NextResponse.json({ error: "Failed to compute quote" }, { status: 500 });
  }
}
