import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { assertMarketingAdmin, MarketingAuthError } from "@/src/modules/bnhub-marketing/services/marketingAccess";
import { createCampaign, listCampaigns } from "@/src/modules/bnhub-marketing/services/marketingCampaignService";
import type { BnhubMarketingCampaignObjective } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await assertMarketingAdmin(await getGuestId());
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as Parameters<typeof listCampaigns>[0]["status"] | null;
    const hostUserId = searchParams.get("hostUserId") ?? undefined;
    const listingId = searchParams.get("listingId") ?? undefined;
    const data = await listCampaigns({
      hostUserId,
      listingId,
      status: status ?? undefined,
      take: Math.min(100, parseInt(searchParams.get("take") ?? "40", 10) || 40),
    });
    return Response.json(data);
  } catch (e) {
    if (e instanceof MarketingAuthError) {
      return Response.json({ error: e.message }, { status: e.code === "UNAUTHORIZED" ? 401 : 403 });
    }
    console.error(e);
    return Response.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminId = await assertMarketingAdmin(await getGuestId());
    const body = (await request.json()) as {
      listingId: string;
      hostUserId: string;
      campaignName: string;
      objective: BnhubMarketingCampaignObjective;
      targetCity?: string;
    };
    const c = await createCampaign({
      listingId: body.listingId,
      hostUserId: body.hostUserId,
      createdBy: adminId,
      campaignName: body.campaignName,
      objective: body.objective,
      targetCity: body.targetCity,
    });
    return Response.json(c);
  } catch (e) {
    if (e instanceof MarketingAuthError) {
      return Response.json({ error: e.message }, { status: e.code === "UNAUTHORIZED" ? 401 : 403 });
    }
    console.error(e);
    return Response.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }
}
