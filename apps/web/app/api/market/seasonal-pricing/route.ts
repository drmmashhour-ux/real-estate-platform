import { NextResponse } from "next/server";

import { getSeasonalPricingRecommendations } from "@/lib/market/seasonalPricingEngine";
import { logError } from "@/lib/monitoring/errorLogger";
import { getClientIp, rateLimit } from "@/lib/security/rateLimit";

export const dynamic = "force-dynamic";

/**
 * GET /api/market/seasonal-pricing
 * Time-based, seasonal, and demand-pressure **recommendations** (no price writes).
 */
export async function GET(req: Request) {
  const ip = getClientIp(req);
  if (!rateLimit(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  try {
    const recommendations = await getSeasonalPricingRecommendations();
    return NextResponse.json({ recommendations });
  } catch (e) {
    logError(e, { route: "/api/market/seasonal-pricing" });
    return NextResponse.json(
      { error: "Failed to load seasonal pricing recommendations" },
      { status: 500 }
    );
  }
}
