import { NextRequest } from "next/server";
import { ListingStatus } from "@prisma/client";
import { prisma } from "@repo/db";
import { getBnhubMarketInsightForPublishedListing } from "@/lib/bnhub/market-price-insight";

/**
 * Public market context for a published stay (BNHUB peer listings only).
 * Does not scrape external OTAs.
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: raw } = await context.params;
    const id = decodeURIComponent(raw ?? "").trim();
    if (!id) {
      return Response.json({ error: "id required" }, { status: 400 });
    }

    const listing = await prisma.shortTermListing.findFirst({
      where: {
        listingStatus: ListingStatus.PUBLISHED,
        OR: [{ id }, { listingCode: id }],
      },
      select: { id: true },
    });
    if (!listing) {
      return Response.json({ error: "Listing not found" }, { status: 404 });
    }

    const insight = await getBnhubMarketInsightForPublishedListing(listing.id);
    if (!insight) {
      return Response.json({ error: "Listing not found" }, { status: 404 });
    }

    return Response.json(insight);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to load market insight" }, { status: 500 });
  }
}
