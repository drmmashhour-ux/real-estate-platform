import { getDemandActions } from "@/lib/market/demandActions";
import { logError } from "@/lib/monitoring/errorLogger";
import { getClientIp, rateLimit } from "@/lib/security/rateLimit";
import { trackEvent } from "@/lib/analytics/tracker";

export const dynamic = "force-dynamic";

/**
 * GET /api/market/demand-actions
 * Order 83 — per-city demand actions (pricing / supply / marketing hints) from the heatmap.
 * Emits one analytics event per city (low volume, 30s heatmap cache).
 */
export async function GET(request: Request) {
  const ip = getClientIp(request);
  if (!rateLimit(ip)) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }
  try {
    const cities = await getDemandActions();
    for (const c of cities) {
      void trackEvent("demand_action_generated", { city: c.city, actions: c.actions });
    }
    return Response.json({ cities });
  } catch (e) {
    logError(e, { route: "/api/market/demand-actions" });
    return Response.json({ error: "Failed to load demand actions" }, { status: 500 });
  }
}
