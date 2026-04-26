import { NextRequest, NextResponse } from "next/server";
import { monolithPrisma } from "@/lib/db/monolith-client";
import { getGuestId } from "@/lib/auth/session";
import { getRecommendationsForListingDetail } from "@/src/modules/recommendations/recommendation.service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const sessionId = req.headers.get("x-session-id")?.trim().slice(0, 128) ?? null;
  const userId = await getGuestId().catch(() => null);

  const row = await monolithPrisma.fsboListing.findUnique({
    where: { id },
    select: {
      id: true,
      city: true,
      propertyType: true,
      priceCents: true,
    },
  });
  if (!row) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  const blocks = await getRecommendationsForListingDetail({
    ctx: { sessionId, userId, excludeIds: [row.id], city: row.city, limit: 8 },
    anchor: {
      id: row.id,
      city: row.city,
      propertyType: row.propertyType,
      priceCents: row.priceCents,
    },
  });

  return NextResponse.json({ ok: true, blocks });
}
