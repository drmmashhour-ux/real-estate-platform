import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { assertMarketingAdmin, MarketingAuthError } from "@/src/modules/bnhub-marketing/services/marketingAccess";
import { duplicateCampaign } from "@/src/modules/bnhub-marketing/services/marketingCampaignService";

export const dynamic = "force-dynamic";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const adminId = await assertMarketingAdmin(await getGuestId());
    const { id } = await params;
    const copy = await duplicateCampaign(id, adminId);
    return Response.json(copy);
  } catch (e) {
    if (e instanceof MarketingAuthError) {
      return Response.json({ error: e.message }, { status: e.code === "UNAUTHORIZED" ? 401 : 403 });
    }
    console.error(e);
    return Response.json({ error: "Failed" }, { status: 400 });
  }
}
