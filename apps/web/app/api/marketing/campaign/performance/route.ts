import { getCampaignPerformance } from "@/lib/marketing/campaignEngine";
import { requireUser } from "@/lib/auth/require-user";
import { logError } from "@/lib/monitoring/errorLogger";
import { getClientIp, rateLimit } from "@/lib/security/rateLimit";
import { isDemoDataActive, parseDemoScenarioFromRequest } from "@/lib/demo/mode";
import { getDemoCampaignPerformanceList } from "@/lib/demo/data";

export const dynamic = "force-dynamic";

/**
 * GET /api/marketing/campaign/performance
 * - Without `campaignId`: list campaigns (latest first) with `limit` (default 20) + `offset`.
 * - With `campaignId`: performance row(s) for that campaign, latest first, paginated.
 */
export async function GET(req: Request) {
  const ip = getClientIp(req);
  if (!rateLimit(ip)) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  if (isDemoDataActive(req)) {
    return Response.json(getDemoCampaignPerformanceList(parseDemoScenarioFromRequest(req)));
  }
  const { searchParams } = new URL(req.url);
  const campaignId = searchParams.get("campaignId") ?? undefined;
  const limitParam = searchParams.get("limit");
  const offsetParam = searchParams.get("offset");
  const limit = Math.min(100, Math.max(1, limitParam == null ? 20 : Number.parseInt(limitParam, 10) || 20));
  const offset = Math.max(0, offsetParam == null ? 0 : Number.parseInt(offsetParam, 10) || 0);
  try {
    const data = await getCampaignPerformance(auth.user.id, { campaignId, limit, offset });
    return Response.json(data);
  } catch (e) {
    logError(e, { route: "/api/marketing/campaign/performance" });
    return Response.json({ error: "Failed to load performance" }, { status: 500 });
  }
}
