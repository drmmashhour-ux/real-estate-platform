import { ListingStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const listing = await prisma.shortTermListing.findFirst({
    where: { id },
    select: {
      id: true,
      title: true,
      listingStatus: true,
      ownerId: true,
    },
  });
  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  const sessionUserId = await getGuestId();
  const isOwner = sessionUserId != null && sessionUserId === listing.ownerId;
  const isPublic = listing.listingStatus === ListingStatus.PUBLISHED;

  if (!isPublic && !isOwner) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [row, actions] = await Promise.all([
    prisma.listingQualityScore.findUnique({ where: { listingId: id } }),
    isOwner
      ? prisma.listingHealthAction.findMany({
          where: { listingId: id, resolved: false },
          orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
          take: 40,
        })
      : Promise.resolve([]),
  ]);

  if (!row) {
    return NextResponse.json({
      listingId: id,
      computed: false,
      message: "Quality score not computed yet. Update the listing or wait a few minutes.",
      ...(isOwner ? { isOwner: true } : {}),
    });
  }

  return NextResponse.json({
    listingId: id,
    computed: true,
    qualityScore: row.qualityScore,
    level: row.level,
    healthStatus: row.healthStatus,
    breakdown: {
      contentScore: row.contentScore,
      pricingScore: row.pricingScore,
      performanceScore: row.performanceScore,
      behaviorScore: row.behaviorScore,
      trustScore: row.trustScore,
    },
    reasonsJson: row.reasonsJson,
    ...(isOwner
      ? {
          isOwner: true,
          actions,
        }
      : { isOwner: false }),
  });
}
