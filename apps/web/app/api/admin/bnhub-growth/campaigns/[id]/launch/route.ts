import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { assertGrowthAdmin, GrowthAuthError } from "@/src/modules/bnhub-growth-engine/services/growthAccess";
import { getGrowthCampaignById, launchCampaign } from "@/src/modules/bnhub-growth-engine/services/growthCampaignService";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const adminId = await assertGrowthAdmin(await getGuestId());
    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as {
      adminApprovedExternal?: boolean;
      confirmIrreversibleExternal?: boolean;
    };
    await launchCampaign(id, {
      adminApprovedExternal: body.adminApprovedExternal === true,
      confirmIrreversibleExternal: body.confirmIrreversibleExternal === true,
      actorId: adminId,
    });
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
