import { z } from "zod";

import { scheduleCampaign } from "@/lib/marketing/campaignEngine";
import { writeMarketplaceEvent } from "@/lib/analytics/tracker";
import { flags } from "@/lib/flags";
import { requireUser } from "@/lib/auth/require-user";
import { logError } from "@/lib/monitoring/errorLogger";
import { getClientIp, rateLimit } from "@/lib/security/rateLimit";

export const dynamic = "force-dynamic";

const BodyZ = z.object({
  campaignId: z.string().uuid(),
  scheduledAt: z.string().datetime(),
});

/**
 * POST /api/marketing/campaign/schedule
 */
export async function POST(req: Request) {
  const ip = getClientIp(req);
  if (!rateLimit(ip)) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }
  if (!flags.AUTONOMOUS_AGENT) {
    return Response.json({ error: "Autonomous marketing disabled" }, { status: 403 });
  }
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  let json: unknown;
  try {
    json = await req.json();
  } catch (e) {
    logError(e, { route: "/api/marketing/campaign/schedule" });
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = BodyZ.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }
  const at = new Date(parsed.data.scheduledAt);
  if (Number.isNaN(at.getTime())) {
    return Response.json({ error: "Invalid scheduledAt" }, { status: 400 });
  }
  try {
    const campaign = await scheduleCampaign(parsed.data.campaignId, auth.user.id, at);
    void writeMarketplaceEvent("campaign_scheduled", {
      userId: auth.user.id,
      campaignId: campaign.id,
      scheduledAt: campaign.scheduledAt?.toISOString() ?? null,
    }).catch(() => {});
    return Response.json({ campaign });
  } catch (e) {
    if (e instanceof Error && e.message === "CAMPAIGN_NOT_FOUND") {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
    if (e instanceof Error && e.message === "INVALID_CAMPAIGN_STATUS_TRANSITION") {
      return Response.json({ error: e.message, detail: "Only draft → scheduled is allowed" }, { status: 400 });
    }
    logError(e, { route: "/api/marketing/campaign/schedule" });
    return Response.json({ error: "Failed to schedule" }, { status: 500 });
  }
}
