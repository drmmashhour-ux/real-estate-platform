import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { assertGrowthCampaignAccess, GrowthAuthError } from "@/src/modules/bnhub-growth-engine/services/growthAccess";
import {
  generateAssetsForCampaign,
  getGrowthCampaignById,
  launchCampaign,
  approveCampaignAssets,
} from "@/src/modules/bnhub-growth-engine/services/growthCampaignService";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getGuestId();
    const { id } = await params;
    await assertGrowthCampaignAccess(userId, id);
    const c = await getGrowthCampaignById(id);
    return Response.json(c);
  } catch (e) {
    if (e instanceof GrowthAuthError) {
      const st = e.code === "NOT_FOUND" ? 404 : e.code === "UNAUTHORIZED" ? 401 : 403;
      return Response.json({ error: e.message }, { status: st });
    }
    console.error(e);
    return Response.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getGuestId();
    const { id } = await params;
    await assertGrowthCampaignAccess(userId, id);
    const body = (await request.json()) as {
      generateAssets?: boolean;
      launch?: boolean;
      approveAssets?: boolean;
      adminApprovedExternal?: boolean;
      confirmIrreversibleExternal?: boolean;
    };
    if (body.generateAssets) await generateAssetsForCampaign(id);
    if (body.approveAssets) await approveCampaignAssets(id);
    if (body.launch) {
      await launchCampaign(id, {
        adminApprovedExternal: body.adminApprovedExternal === true,
        confirmIrreversibleExternal: body.confirmIrreversibleExternal === true,
        actorId: userId,
      });
    }
    const c = await getGrowthCampaignById(id);
    return Response.json(c);
  } catch (e) {
    if (e instanceof GrowthAuthError) {
      const st = e.code === "NOT_FOUND" ? 404 : e.code === "UNAUTHORIZED" ? 401 : 403;
      return Response.json({ error: e.message }, { status: st });
    }
    console.error(e);
    return Response.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }
}
