import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { assertCampaignAccess, MarketingAuthError } from "@/src/modules/bnhub-marketing/services/marketingAccess";
import { saveEditedAsset } from "@/src/modules/bnhub-marketing/services/marketingAssetService";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ assetId: string }> }
) {
  try {
    const userId = await getGuestId();
    const { assetId } = await params;
    const asset = await prisma.bnhubMarketingAsset.findUnique({
      where: { id: assetId },
      select: { campaignId: true },
    });
    if (!asset) return Response.json({ error: "Not found" }, { status: 404 });
    await assertCampaignAccess(userId, asset.campaignId);
    const body = (await request.json()) as { content: string; title?: string | null };
    if (typeof body.content !== "string") return Response.json({ error: "content required" }, { status: 400 });
    const updated = await saveEditedAsset(assetId, { content: body.content, title: body.title });
    return Response.json(updated);
  } catch (e) {
    if (e instanceof MarketingAuthError) {
      const st = e.code === "NOT_FOUND" ? 404 : e.code === "UNAUTHORIZED" ? 401 : 403;
      return Response.json({ error: e.message }, { status: st });
    }
    console.error(e);
    return Response.json({ error: "Failed" }, { status: 400 });
  }
}
