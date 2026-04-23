import { NextRequest } from "next/server";
import type { ShortTermListing } from "@prisma/client";
import { prisma } from "@repo/db";
import {
  listGuestVisibleListingServices,
  suggestAddonServiceCodes,
} from "@/lib/bnhub/hospitality-addons";

export const dynamic = "force-dynamic";

/** GET — guest-visible add-ons for a listing (trust / premium rules applied). */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: listingId } = await params;
    const listing = await prisma.shortTermListing.findUnique({
      where: { id: listingId },
      select: {
        id: true,
        propertyType: true,
        city: true,
        familyFriendly: true,
        experienceTags: true,
      },
    });
    if (!listing) {
      return Response.json({ error: "Listing not found" }, { status: 404 });
    }
    const [offers, suggestedServiceCodes] = await Promise.all([
      listGuestVisibleListingServices(listingId),
      Promise.resolve(
        suggestAddonServiceCodes({
          propertyType: listing.propertyType,
          city: listing.city,
          familyFriendly: listing.familyFriendly,
          experienceTags: listing.experienceTags as ShortTermListing["experienceTags"],
        })
      ),
    ]);
    return Response.json({ offers, suggestedServiceCodes });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to load offers" }, { status: 500 });
  }
}
