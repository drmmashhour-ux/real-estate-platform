import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { AnalyticsEvents } from "@/lib/analytics/events";
import { captureServerEvent } from "@/lib/analytics/posthog-server";
import { getListingsForBroker } from "@/lib/broker/collaboration";
import { allocateUniqueLSTListingCode } from "@/lib/listing-code";

export const dynamic = "force-dynamic";

/** GET: list listings the current broker can access (owned + shared). */
export async function GET() {
  const brokerId = await getGuestId();
  if (!brokerId) {
    return Response.json({ error: "Sign in required" }, { status: 401 });
  }
  try {
    const listings = await getListingsForBroker(brokerId);
    return Response.json(listings);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to list listings" }, { status: 500 });
  }
}

/** POST: create a listing (current user becomes owner) and grant self owner access. */
export async function POST(req: NextRequest) {
  const brokerId = await getGuestId();
  if (!brokerId) {
    return Response.json({ error: "Sign in required" }, { status: 401 });
  }
  try {
    const body = await req.json().catch(() => ({}));
    const title = body.title ?? "New listing";
    const price = Number(body.price);
    const listing = await prisma.$transaction(async (tx) => {
      const listingCode = await allocateUniqueLSTListingCode(tx);
      return tx.listing.create({
        data: {
          listingCode,
          title: String(title),
          price: Number.isNaN(price) ? 0 : price,
          ownerId: brokerId,
        },
      });
    });
    await prisma.brokerListingAccess.create({
      data: {
        listingId: listing.id,
        brokerId,
        role: "owner",
        grantedById: brokerId,
      },
    });
    captureServerEvent(brokerId, AnalyticsEvents.LISTING_CREATED, {
      listingId: listing.id,
      source: "broker_listings",
    });
    return Response.json(listing);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to create listing" }, { status: 500 });
  }
}
