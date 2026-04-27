import { NextResponse } from "next/server";

import { getTrustSignals } from "@/lib/market/trustSignals";
import { logError } from "@/lib/monitoring/errorLogger";
import { getClientIp, rateLimit } from "@/lib/security/rateLimit";

export const dynamic = "force-dynamic";

/**
 * GET /api/demo/trust-signals?city=Montreal — public read-only trust strip for live demo (Order 46).
 */
export async function GET(req: Request) {
  const ip = getClientIp(req);
  if (!rateLimit(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  const { searchParams } = new URL(req.url);
  const city = searchParams.get("city")?.trim() || undefined;
  try {
    const signals = await getTrustSignals(city);
    return NextResponse.json(signals);
  } catch (e) {
    logError(e, { route: "/api/demo/trust-signals" });
    return NextResponse.json({ error: "Failed to load trust signals" }, { status: 500 });
  }
}
