import { NextResponse } from "next/server";
import { getPricingPlans, getFeaturedBoostPackages, getPricingModelExplanation } from "@/modules/business";
import { hostEconomicsFlags } from "@/config/feature-flags";

export const dynamic = "force-dynamic";

/** GET /api/pricing/plans — public product configuration (caveated). */
export async function GET() {
  if (!hostEconomicsFlags.pricingModelV1) {
    return NextResponse.json({ error: "Feature disabled" }, { status: 403 });
  }

  const plans = getPricingPlans();
  const featured = getFeaturedBoostPackages();
  const explainer = getPricingModelExplanation();

  return NextResponse.json({
    ok: true,
    plans,
    featuredBoosts: featured,
    explainer,
  });
}
