import { NextRequest } from "next/server";
import {
  verifyBnhubGrowthAutomationRequest,
  unauthorizedGrowthAutomation,
} from "@/lib/server/bnhub-growth-internal-auth";
import {
  changeGrowthCampaignStatus,
  approveCampaignAssets,
} from "@/src/modules/bnhub-growth-engine/services/growthCampaignService";
import { BnhubGrowthCampaignStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!verifyBnhubGrowthAutomationRequest(request)) return unauthorizedGrowthAutomation();
  const body = (await request.json()) as {
    campaignId: string;
    action: "mark_ready" | "approve_assets" | "mark_active";
  };
  if (!body.campaignId || !body.action) {
    return Response.json({ error: "campaignId and action required" }, { status: 400 });
  }
  if (body.action === "approve_assets") {
    const c = await approveCampaignAssets(body.campaignId);
    return Response.json({ ok: true, campaign: c });
  }
  if (body.action === "mark_ready") {
    const c = await changeGrowthCampaignStatus(body.campaignId, BnhubGrowthCampaignStatus.READY);
    return Response.json({ ok: true, campaign: c });
  }
  if (body.action === "mark_active") {
    const c = await changeGrowthCampaignStatus(body.campaignId, BnhubGrowthCampaignStatus.ACTIVE);
    return Response.json({ ok: true, campaign: c });
  }
  return Response.json({ error: "Unknown action" }, { status: 400 });
}
