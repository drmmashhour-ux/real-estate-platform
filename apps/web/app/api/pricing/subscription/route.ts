import { NextRequest, NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import { getSubscriptionPricingQuote } from "@/modules/monetization/dynamic-market-pricing.service";

export const dynamic = "force-dynamic";

/**
 * GET /api/pricing/subscription — dynamic operator subscription quote (CAD).
 * Query: refresh=1, record=0
 */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const refreshFactors = sp.get("refresh") === "1";
    const recordEvent = sp.get("record") !== "0";

    const quote = await getSubscriptionPricingQuote({ refreshFactors, recordEvent });

    return NextResponse.json({
      ok: true,
      ...quote,
      disclaimers: [
        "Subscription tiers adjust gradually with platform demand — no sudden spikes.",
      ],
    });
  } catch (e) {
    logError("[api.pricing.subscription]", { error: e });
    return NextResponse.json({ error: "Failed to compute quote" }, { status: 500 });
  }
}
