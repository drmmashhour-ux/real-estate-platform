import { getMarketInsights } from "@/lib/services/marketInsightsService";
import { logError } from "@/lib/monitoring/errorLogger";
import { getClientIp, rateLimit } from "@/lib/security/rateLimit";

export const dynamic = "force-dynamic";

/**
 * GET /api/market/insights
 * Demand heatmap → rule-based market insights and recommended actions.
 */
export async function GET(req: Request) {
  const ip = getClientIp(req);
  if (!rateLimit(ip)) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }
  try {
    return Response.json(await getMarketInsights());
  } catch (e) {
    logError(e, { route: "/api/market/insights" });
    return Response.json({ error: "Failed to load market insights" }, { status: 500 });
  }
}
