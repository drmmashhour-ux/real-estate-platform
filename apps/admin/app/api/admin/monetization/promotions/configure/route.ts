import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/monetization/promotions/configure – create or update promotion campaign.
 * Body: { id?, name, campaignType, marketId?, budgetCents?, startAt, endAt, status? }
 * In production, restrict to admin role.
 */
export async function POST(request: NextRequest) {
  try {
    await getGuestId();
    const body = await request.json().catch(() => ({}));
    const {
      id,
      name,
      campaignType,
      marketId,
      budgetCents,
      startAt,
      endAt,
      status,
    } = body;

    if (!name || !campaignType || !startAt || !endAt) {
      return Response.json(
        { error: "name, campaignType, startAt, endAt required" },
        { status: 400 }
      );
    }
    const validStatuses = ["DRAFT", "ACTIVE", "PAUSED", "ENDED"];
    const newStatus = status && validStatuses.includes(status) ? status : "DRAFT";

    if (id) {
      const campaign = await prisma.promotionCampaign.update({
        where: { id },
        data: {
          name,
          campaignType,
          marketId: marketId ?? undefined,
          budgetCents: budgetCents != null ? Number(budgetCents) : undefined,
          startAt: new Date(startAt),
          endAt: new Date(endAt),
          status: newStatus as "DRAFT" | "ACTIVE" | "PAUSED" | "ENDED",
        },
      });
      return Response.json(campaign);
    }

    const campaign = await prisma.promotionCampaign.create({
      data: {
        name,
        campaignType,
        marketId: marketId ?? undefined,
        budgetCents: budgetCents != null ? Number(budgetCents) : undefined,
        startAt: new Date(startAt),
        endAt: new Date(endAt),
        status: newStatus as "DRAFT" | "ACTIVE" | "PAUSED" | "ENDED",
      },
    });
    return Response.json(campaign);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to configure campaign";
    return Response.json({ error: message }, { status: 400 });
  }
}
