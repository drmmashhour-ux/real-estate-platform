import { z } from "zod";

import { writeMarketplaceEvent } from "@/lib/analytics/tracker";
import { optimizeCampaign } from "@/lib/marketing/campaignOptimizer";
import { flags } from "@/lib/flags";
import { requireUser } from "@/lib/auth/require-user";
import { logError } from "@/lib/monitoring/errorLogger";
import { getClientIp, rateLimit } from "@/lib/security/rateLimit";

export const dynamic = "force-dynamic";

const BodyZ = z.object({
  campaignId: z.string().uuid(),
  dryRun: z.boolean().optional().default(true),
});

/**
 * POST /api/marketing/campaign/optimize — AI-style optimization for **simulated** campaigns only.
 */
export async function POST(req: Request) {
  const ip = getClientIp(req);
  if (!rateLimit(ip)) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }
  if (!flags.AUTONOMOUS_AGENT) {
    return Response.json({ error: "Autonomous marketing disabled", enabled: false }, { status: 403 });
  }
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  let json: unknown;
  try {
    json = await req.json();
  } catch (e) {
    logError(e, { route: "/api/marketing/campaign/optimize" });
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = BodyZ.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }
  const { campaignId, dryRun } = parsed.data;
  try {
    const out = await optimizeCampaign(campaignId, auth.user.id, dryRun);
    void writeMarketplaceEvent("campaign_optimized", {
      campaignId,
      recommendation: out.insight.recommendation,
      dryRun,
    }).catch(() => {});
    return Response.json({
      ...out,
      recommendation: out.insight.recommendation,
      reason: out.insight.reason,
      suggestedAction: out.insight.suggestedAction,
      newCopy: out.newCopy ?? out.adCopySuggestion,
    });
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === "CAMPAIGN_NOT_FOUND") {
        return Response.json({ error: "Not found" }, { status: 404 });
      }
      if (e.message === "OPTIMIZATION_DISABLED") {
        return Response.json({ error: "Optimization disabled" }, { status: 403 });
      }
    }
    logError(e, { route: "/api/marketing/campaign/optimize" });
    return Response.json({ error: "Optimization failed" }, { status: 500 });
  }
}
