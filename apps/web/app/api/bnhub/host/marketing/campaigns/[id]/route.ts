import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { MarketingAuthError, assertCampaignAccess } from "@/src/modules/bnhub-marketing/services/marketingAccess";
import { getCampaignById, updateCampaign } from "@/src/modules/bnhub-marketing/services/marketingCampaignService";
import { generateAssetPackFromListing } from "@/src/modules/bnhub-marketing/services/marketingAssetService";
import { createDistributionPlan } from "@/src/modules/bnhub-marketing/services/distributionService";
import {
  publishToInternalEmailMock,
  publishToInternalHomepageMock,
  publishToInternalSearchBoostMock,
} from "@/src/modules/bnhub-marketing/services/distributionService";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getGuestId();
    const { id } = await params;
    await assertCampaignAccess(userId, id);
    const c = await getCampaignById(id);
    return Response.json(c);
  } catch (e) {
    if (e instanceof MarketingAuthError) {
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
    await assertCampaignAccess(userId, id);
    const body = (await request.json()) as {
      campaignName?: string;
      notes?: string | null;
      generateAssets?: boolean;
      planChannels?: string[];
      publish?: { distributionId: string; action: "internal_homepage" | "internal_search_boost" | "internal_email" };
    };
    if (body.generateAssets) {
      await generateAssetPackFromListing(id);
    }
    if (body.planChannels?.length) {
      await createDistributionPlan(id, body.planChannels);
    }
    if (body.publish) {
      const { distributionId, action } = body.publish;
      if (action === "internal_homepage") await publishToInternalHomepageMock(distributionId);
      else if (action === "internal_search_boost") await publishToInternalSearchBoostMock(distributionId);
      else if (action === "internal_email") await publishToInternalEmailMock(distributionId);
    }
    if (body.campaignName != null || body.notes != null) {
      await updateCampaign(id, { campaignName: body.campaignName, notes: body.notes });
    }
    const c = await getCampaignById(id);
    return Response.json(c);
  } catch (e) {
    if (e instanceof MarketingAuthError) {
      const st = e.code === "NOT_FOUND" ? 404 : e.code === "UNAUTHORIZED" ? 401 : 403;
      return Response.json({ error: e.message }, { status: st });
    }
    console.error(e);
    return Response.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }
}
