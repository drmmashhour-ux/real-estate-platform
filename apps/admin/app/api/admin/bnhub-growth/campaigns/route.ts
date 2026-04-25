import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { assertGrowthAdmin, GrowthAuthError } from "@/src/modules/bnhub-growth-engine/services/growthAccess";
import {
  createGrowthCampaignDraft,
  listGrowthCampaigns,
} from "@/src/modules/bnhub-growth-engine/services/growthCampaignService";
import type {
  BnhubGrowthAutonomyLevel,
  BnhubGrowthCampaignObjective,
  BnhubGrowthCampaignType,
} from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await assertGrowthAdmin(await getGuestId());
    const campaigns = await listGrowthCampaigns({ take: 80 });
    return Response.json({ campaigns });
  } catch (e) {
    if (e instanceof GrowthAuthError) {
      return Response.json({ error: e.message }, { status: e.code === "UNAUTHORIZED" ? 401 : 403 });
    }
    console.error(e);
    return Response.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminId = await assertGrowthAdmin(await getGuestId());
    const body = (await request.json()) as {
      listingId: string;
      hostUserId: string;
      campaignName: string;
      campaignType: BnhubGrowthCampaignType;
      objective: BnhubGrowthCampaignObjective;
      autonomyLevel: BnhubGrowthAutonomyLevel;
    };
    const c = await createGrowthCampaignDraft({
      ...body,
      createdBy: adminId,
    });
    return Response.json(c);
  } catch (e) {
    if (e instanceof GrowthAuthError) {
      return Response.json({ error: e.message }, { status: e.code === "UNAUTHORIZED" ? 401 : 403 });
    }
    console.error(e);
    return Response.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }
}
