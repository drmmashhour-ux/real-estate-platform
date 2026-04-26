import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { freezeListing, holdPayoutsForListing } from "@/lib/trust-safety/fraud-response";
import { monolithPrisma } from "@/lib/db/monolith-client";

/**
 * POST /api/listings/:id/freeze
 * Freeze listing (set to UNDER_INVESTIGATION), hide from public, hold payouts.
 * In production restrict to admin or fraud system.
 */
export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getGuestId();
    if (!userId) {
      return Response.json({ error: "Sign in required" }, { status: 401 });
    }

    const { id: listingId } = await context.params;
    const listing = await monolithPrisma.shortTermListing.findUnique({
      where: { id: listingId },
      select: { id: true, listingStatus: true },
    });
    if (!listing) {
      return Response.json({ error: "Listing not found" }, { status: 404 });
    }

    const blocked = ["UNDER_INVESTIGATION", "FROZEN", "REJECTED_FOR_FRAUD", "PERMANENTLY_REMOVED", "SUSPENDED"];
    if (listing.listingStatus && blocked.includes(listing.listingStatus)) {
      return Response.json({ error: "Listing is already frozen or removed" }, { status: 400 });
    }

    await freezeListing(listingId);
    const count = await holdPayoutsForListing(listingId, "fraud_investigation");

    return Response.json({
      success: true,
      listingStatus: "UNDER_INVESTIGATION",
      payoutsHeld: count,
    });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to freeze listing" }, { status: 500 });
  }
}
