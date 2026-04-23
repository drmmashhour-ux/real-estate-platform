import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { suggestHostPrice } from "@/lib/listings/listing-demand-engine";
import { refreshFsboListingAnalytics } from "@/lib/listings/listing-analytics-service";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const listing = await prisma.fsboListing.findUnique({
    where: { id },
    select: { ownerId: true, priceCents: true },
  });
  if (!listing || listing.ownerId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const row = await refreshFsboListingAnalytics(id, listing.priceCents);
  const suggestion = suggestHostPrice({
    currentPriceCents: listing.priceCents,
    demandScore: row.demandScore,
  });

  return NextResponse.json({
    demandScore: row.demandScore,
    views24h: row.views24hCached,
    uniqueViews24h: row.uniqueViews24hCached,
    saves: row.saves,
    contactClicks: row.contactClicks,
    bookingAttempts: row.bookingAttempts,
    bookings: row.bookings,
    suggestion,
  });
}
