import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { createCampaign, listCampaigns } from "@/src/modules/bnhub-marketing/services/marketingCampaignService";
import type { BnhubMarketingCampaignObjective } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const data = await listCampaigns({ hostUserId: userId, take: 50 });
  return Response.json(data);
}

export async function POST(request: NextRequest) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json()) as {
    listingId: string;
    campaignName: string;
    objective: BnhubMarketingCampaignObjective;
  };
  try {
    const c = await createCampaign({
      listingId: body.listingId,
      hostUserId: userId,
      createdBy: userId,
      campaignName: body.campaignName,
      objective: body.objective,
    });
    return Response.json(c);
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }
}
