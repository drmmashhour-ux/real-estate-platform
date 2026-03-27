import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { assertGrowthAdmin, GrowthAuthError } from "@/src/modules/bnhub-growth-engine/services/growthAccess";
import { generateAssetsForCampaign, getGrowthCampaignById } from "@/src/modules/bnhub-growth-engine/services/growthCampaignService";

export const dynamic = "force-dynamic";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await assertGrowthAdmin(await getGuestId());
    const { id } = await params;
    await generateAssetsForCampaign(id);
    const c = await getGrowthCampaignById(id);
    return Response.json(c);
  } catch (e) {
    if (e instanceof GrowthAuthError) {
      return Response.json({ error: e.message }, { status: e.code === "UNAUTHORIZED" ? 401 : 403 });
    }
    console.error(e);
    return Response.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }
}
