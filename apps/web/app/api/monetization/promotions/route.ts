import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { createPromotion, listActiveCampaigns } from "@/lib/monetization";

/**
 * GET /api/monetization/promotions – list active campaigns
 * Query: marketId?
 *
 * POST /api/monetization/promotions – add listing to promotion
 * Body: { listingId, campaignId, startAt, endAt, placement, costCents? }
 */
export async function GET(request: NextRequest) {
  try {
    await getGuestId();
    const marketId = new URL(request.url).searchParams.get("marketId") ?? undefined;
    const campaigns = await listActiveCampaigns(marketId);
    return Response.json({ campaigns });
  } catch (e) {
    return Response.json({ error: "Failed to list campaigns" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const { listingId, campaignId, startAt, endAt, placement, costCents } = body;
    if (!listingId || !campaignId || !startAt || !endAt || !placement) {
      return Response.json({ error: "listingId, campaignId, startAt, endAt, placement required" }, { status: 400 });
    }

    const promotion = await createPromotion({
      listingId,
      campaignId,
      startAt: new Date(startAt),
      endAt: new Date(endAt),
      placement,
      costCents: costCents ?? null,
    });
    return Response.json(promotion);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create promotion";
    return Response.json({ error: message }, { status: 400 });
  }
}
