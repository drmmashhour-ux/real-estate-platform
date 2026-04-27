import { getDemandHeatmap } from "@/lib/market/demandHeatmap";
import { logError } from "@/lib/monitoring/errorLogger";
import { getClientIp, rateLimit } from "@/lib/security/rateLimit";

export const dynamic = "force-dynamic";

/**
 * GET /api/market/demand-heatmap
 * Per-city view + booking demand, normalized by published listing count (fair across city sizes),
 * with conversion rate, 7d booking trend, and 30s in-memory cache. Sorted by `demandScore` desc.
 */
export async function GET(req: Request) {
  const ip = getClientIp(req);
  if (!rateLimit(ip)) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }
  try {
    return Response.json(await getDemandHeatmap());
  } catch (e) {
    logError(e, { route: "/api/market/demand-heatmap" });
    return Response.json({ error: "Failed to load demand heatmap" }, { status: 500 });
  }
}
