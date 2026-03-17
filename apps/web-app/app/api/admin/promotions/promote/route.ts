import { NextRequest } from "next/server";
import { promoteListing } from "@/lib/promotions";
import type { PromotionPlacement } from "@prisma/client";

export const dynamic = "force-dynamic";

const PLACEMENTS: PromotionPlacement[] = ["FEATURED", "SPONSORED", "BOOST"];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { listingId, campaignId, startAt, endAt, placement, costCents } = body;
    if (!listingId || !campaignId || !startAt || !endAt || !placement) {
      return Response.json(
        { error: "listingId, campaignId, startAt, endAt, placement required" },
        { status: 400 }
      );
    }
    if (!PLACEMENTS.includes(placement)) {
      return Response.json({ error: "placement must be FEATURED, SPONSORED, or BOOST" }, { status: 400 });
    }
    const promotion = await promoteListing({
      listingId,
      campaignId,
      startAt: new Date(startAt),
      endAt: new Date(endAt),
      placement,
      costCents: costCents != null ? Number(costCents) : undefined,
    });
    return Response.json(promotion);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to promote listing" }, { status: 500 });
  }
}
