import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import {
  createGrowthCampaignDraft,
  listGrowthCampaigns,
} from "@/src/modules/bnhub-growth-engine/services/growthCampaignService";
import type {
  BnhubGrowthAutonomyLevel,
  BnhubGrowthCampaignObjective,
  BnhubGrowthCampaignType,
} from "@prisma/client";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const campaigns = await listGrowthCampaigns({ hostUserId: userId, take: 50 });
  return Response.json({ campaigns });
}

export async function POST(request: NextRequest) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json()) as {
    listingId: string;
    campaignName: string;
    campaignType: BnhubGrowthCampaignType;
    objective: BnhubGrowthCampaignObjective;
    autonomyLevel: BnhubGrowthAutonomyLevel;
  };
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: body.listingId },
    select: { ownerId: true },
  });
  if (!listing || listing.ownerId !== userId) {
    return Response.json({ error: "Not your listing" }, { status: 403 });
  }
  const c = await createGrowthCampaignDraft({
    ...body,
    hostUserId: userId,
    createdBy: userId,
  });
  return Response.json(c);
}
