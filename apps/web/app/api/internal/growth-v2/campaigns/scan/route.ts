import { NextRequest } from "next/server";
import {
  cronNotConfigured,
  cronUnauthorized,
  verifyCronBearer,
} from "@/lib/server/internal-cron-auth";
import { scanGrowthCampaignCandidatesV2 } from "@/src/modules/growth/campaigns/campaign.service";
import { engineFlags } from "@/config/feature-flags";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!process.env.CRON_SECRET?.trim()) return cronNotConfigured();
  if (!verifyCronBearer(request)) return cronUnauthorized();
  if (!engineFlags.campaignAutopilotV2) {
    return Response.json({ ok: false, error: "FEATURE_CAMPAIGN_AUTOPILOT_V2 disabled" }, { status: 403 });
  }
  void request;
  const r = await scanGrowthCampaignCandidatesV2();
  return Response.json({ ok: true, inserted: r.inserted, suppressed: r.suppressed });
}
