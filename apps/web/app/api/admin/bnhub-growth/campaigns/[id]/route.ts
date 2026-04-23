import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { assertGrowthAdmin, GrowthAuthError } from "@/src/modules/bnhub-growth-engine/services/growthAccess";
import { getGrowthCampaignById } from "@/src/modules/bnhub-growth-engine/services/growthCampaignService";
import type { BnhubGrowthCampaignStatus } from "@prisma/client";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await assertGrowthAdmin(await getGuestId());
    const { id } = await params;
    const c = await getGrowthCampaignById(id);
    if (!c) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json(c);
  } catch (e) {
    if (e instanceof GrowthAuthError) {
      return Response.json({ error: e.message }, { status: e.code === "UNAUTHORIZED" ? 401 : 403 });
    }
    console.error(e);
    return Response.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await assertGrowthAdmin(await getGuestId());
    const { id } = await params;
    const body = (await request.json()) as {
      status?: BnhubGrowthCampaignStatus;
      campaignName?: string;
    };
    const c = await prisma.bnhubGrowthCampaign.update({
      where: { id },
      data: body,
    });
    return Response.json(c);
  } catch (e) {
    if (e instanceof GrowthAuthError) {
      return Response.json({ error: e.message }, { status: e.code === "UNAUTHORIZED" ? 401 : 403 });
    }
    console.error(e);
    return Response.json({ error: "Failed" }, { status: 400 });
  }
}
