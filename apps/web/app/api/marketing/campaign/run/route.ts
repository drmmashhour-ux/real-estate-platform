import { z } from "zod";

import {
  derivePerformanceMetrics,
  runCampaignSimulation,
  runCampaignSimulationByCampaignId,
  type RunCampaignResult,
} from "@/lib/marketing/campaignEngine";
import { writeMarketplaceEvent } from "@/lib/analytics/tracker";
import { flags } from "@/lib/flags";
import { requireUser } from "@/lib/auth/require-user";
import { logError } from "@/lib/monitoring/errorLogger";
import { getClientIp, rateLimit } from "@/lib/security/rateLimit";

export const dynamic = "force-dynamic";

const BodyZ = z.object({
  campaignId: z.string().uuid(),
});

function jsonForRunResult(result: RunCampaignResult) {
  if (result.kind === "noop") {
    const metrics = derivePerformanceMetrics(result.performance);
    void writeMarketplaceEvent("campaign_simulated", {
      campaignId: result.campaign.id,
      alreadySimulated: true,
    }).catch(() => {});
    return Response.json({
      campaign: result.campaign,
      performance: result.performance,
      metrics,
      alreadySimulated: true,
      simulated: true,
    });
  }
  const metrics = derivePerformanceMetrics(result.performance);
  const userId = result.campaign.userId;
  void writeMarketplaceEvent("campaign_run", {
    userId,
    campaignId: result.campaign.id,
    impressions: result.performance.impressions,
    clicks: result.performance.clicks,
    conversions: result.performance.conversions,
    spend: result.performance.spend,
  }).catch(() => {});

  void writeMarketplaceEvent("campaign_simulated", {
    campaignId: result.campaign.id,
    dryRun: false,
  }).catch(() => {});

  void writeMarketplaceEvent("campaign_completed", {
    userId,
    campaignId: result.campaign.id,
    conversions: result.performance.conversions,
    spend: result.performance.spend,
  }).catch(() => {});

  return Response.json({
    campaign: result.campaign,
    performance: result.performance,
    metrics,
    alreadySimulated: false,
    simulated: true,
  });
}

/**
 * POST /api/marketing/campaign/run — **simulation** (CRON-friendly).
 * When `CRON_SECRET` is set, matching `x-cron-secret` authenticates without a user session.
 * Inserts at most one `BrokerAdSimulationPerformance` per campaign; sets `completed`.
 */
export async function POST(req: Request) {
  const ip = getClientIp(req);
  if (!rateLimit(ip)) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }
  if (!flags.AUTONOMOUS_AGENT) {
    return Response.json({ error: "Autonomous marketing disabled" }, { status: 403 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch (e) {
    logError(e, { route: "/api/marketing/campaign/run" });
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = BodyZ.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  const cronHeader = req.headers.get("x-cron-secret");
  const cronEnv = process.env.CRON_SECRET;
  const isCron = Boolean(cronEnv && cronHeader === cronEnv);

  if (cronEnv) {
    if (cronHeader != null && cronHeader !== cronEnv) {
      return Response.json({ error: "Invalid cron secret" }, { status: 403 });
    }
  } else if (cronHeader != null) {
    return Response.json({ error: "Cron secret not configured" }, { status: 403 });
  }

  try {
    if (isCron) {
      const result = await runCampaignSimulationByCampaignId(parsed.data.campaignId);
      return jsonForRunResult(result);
    }
    const auth = await requireUser();
    if (!auth.ok) return auth.response;
    const result = await runCampaignSimulation(parsed.data.campaignId, auth.user.id);
    return jsonForRunResult(result);
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === "CAMPAIGN_NOT_FOUND") {
        return Response.json({ error: "Not found" }, { status: 404 });
      }
      if (e.message === "SIMULATION_ALREADY_RAN" || e.message === "MUST_SCHEDULE_FIRST") {
        return Response.json({ error: e.message }, { status: 409 });
      }
      if (e.message === "INVALID_STATUS_FOR_RUN") {
        return Response.json({ error: e.message }, { status: 400 });
      }
    }
    logError(e, { route: "/api/marketing/campaign/run" });
    return Response.json({ error: "Failed to run simulation" }, { status: 500 });
  }
}
