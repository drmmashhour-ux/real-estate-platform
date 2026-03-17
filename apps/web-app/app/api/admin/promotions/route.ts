import { NextRequest } from "next/server";
import { getPromotionCampaigns, createPromotionCampaign } from "@/lib/promotions";
import type { PromotionCampaignStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const marketId = searchParams.get("marketId") ?? undefined;
    const status = searchParams.get("status") as PromotionCampaignStatus | undefined;
    const campaigns = await getPromotionCampaigns({ marketId, status });
    return Response.json(campaigns);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to fetch campaigns" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, campaignType, marketId, budgetCents, startAt, endAt, createdBy } = body;
    if (!name || !campaignType || !startAt || !endAt) {
      return Response.json(
        { error: "name, campaignType, startAt, endAt required" },
        { status: 400 }
      );
    }
    const campaign = await createPromotionCampaign({
      name,
      campaignType,
      marketId,
      budgetCents: budgetCents != null ? Number(budgetCents) : undefined,
      startAt: new Date(startAt),
      endAt: new Date(endAt),
      createdBy,
    });
    return Response.json(campaign);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to create campaign" }, { status: 500 });
  }
}
