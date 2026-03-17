import { NextRequest } from "next/server";
import { getGrowthCampaigns, createGrowthCampaign } from "@/lib/growth-acquisition";
import type { GrowthCampaignStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const VALID_STATUSES: GrowthCampaignStatus[] = ["DRAFT", "ACTIVE", "PAUSED", "ENDED"];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const marketId = searchParams.get("marketId") ?? undefined;
    const statusParam = searchParams.get("status");
    const status = statusParam && VALID_STATUSES.includes(statusParam as GrowthCampaignStatus)
      ? (statusParam as GrowthCampaignStatus)
      : undefined;
    const campaigns = await getGrowthCampaigns({ marketId, status });
    return Response.json(campaigns);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to fetch campaigns" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, campaignType, marketId, startAt, endAt, config } = body;
    if (!name || !campaignType || !startAt || !endAt) {
      return Response.json(
        { error: "name, campaignType, startAt, endAt required" },
        { status: 400 }
      );
    }
    const campaign = await createGrowthCampaign({
      name,
      campaignType,
      marketId,
      startAt: new Date(startAt),
      endAt: new Date(endAt),
      config,
    });
    return Response.json(campaign);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to create campaign" }, { status: 500 });
  }
}
