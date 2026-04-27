import { NextResponse } from "next/server";

import { getCityPricingRecommendations } from "@/lib/market/cityPricingEngine";
import { logError } from "@/lib/monitoring/errorLogger";
import { getClientIp, rateLimit } from "@/lib/security/rateLimit";
import { isDemoDataActive, parseDemoScenarioFromRequest } from "@/lib/demo/mode";
import { getDemoCityPricing } from "@/lib/demo/data";

export const dynamic = "force-dynamic";

/**
 * GET /api/market/city-pricing
 * City-level BNHub pricing **recommendations** (no price writes).
 */
export async function GET(req: Request) {
  const ip = getClientIp(req);
  if (!rateLimit(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  if (isDemoDataActive(req)) {
    const recommendations = getDemoCityPricing(parseDemoScenarioFromRequest(req));
    return NextResponse.json({ recommendations, demo: true });
  }
  try {
    const recommendations = await getCityPricingRecommendations();
    return NextResponse.json({ recommendations });
  } catch (e) {
    logError(e, { route: "/api/market/city-pricing" });
    return NextResponse.json(
      { error: "Failed to load city pricing recommendations" },
      { status: 500 }
    );
  }
}
