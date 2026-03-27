import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { assertMarketingAdmin, MarketingAuthError } from "@/src/modules/bnhub-marketing/services/marketingAccess";
import {
  archiveCampaign,
  getCampaignById,
  updateCampaign,
} from "@/src/modules/bnhub-marketing/services/marketingCampaignService";
import type { BnhubMarketingCampaignStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await assertMarketingAdmin(await getGuestId());
    const { id } = await params;
    const c = await getCampaignById(id);
    if (!c) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json(c);
  } catch (e) {
    if (e instanceof MarketingAuthError) {
      return Response.json({ error: e.message }, { status: e.code === "UNAUTHORIZED" ? 401 : 403 });
    }
    console.error(e);
    return Response.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await assertMarketingAdmin(await getGuestId());
    const { id } = await params;
    const body = (await request.json()) as {
      campaignName?: string;
      status?: BnhubMarketingCampaignStatus;
      notes?: string | null;
    };
    if (body.status === "ARCHIVED") {
      await archiveCampaign(id);
      return Response.json({ ok: true });
    }
    const c = await updateCampaign(id, body);
    return Response.json(c);
  } catch (e) {
    if (e instanceof MarketingAuthError) {
      return Response.json({ error: e.message }, { status: e.code === "UNAUTHORIZED" ? 401 : 403 });
    }
    console.error(e);
    return Response.json({ error: "Failed" }, { status: 400 });
  }
}
