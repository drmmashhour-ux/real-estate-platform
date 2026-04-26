import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { upsertPropertyLocationValidation } from "@/lib/verification/geo-validation";

/**
 * POST /api/location-validation
 * Fields: listing_id, latitude, longitude, address.
 * Creates or updates property_location_validation for the listing.
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) {
      return Response.json({ error: "Sign in required" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const listingId = (body.listing_id as string)?.trim();
    const latitude = body.latitude != null ? Number(body.latitude) : undefined;
    const longitude = body.longitude != null ? Number(body.longitude) : undefined;
    const address = typeof body.address === "string" ? body.address.trim() : "";

    if (!listingId) {
      return Response.json({ error: "listing_id required" }, { status: 400 });
    }
    if (latitude == null || longitude == null || Number.isNaN(latitude) || Number.isNaN(longitude)) {
      return Response.json({ error: "latitude and longitude required" }, { status: 400 });
    }
    if (!address) {
      return Response.json({ error: "address required" }, { status: 400 });
    }

    const listing = await prisma.shortTermListing.findUnique({
      where: { id: listingId },
      select: { ownerId: true },
    });
    if (!listing) {
      return Response.json({ error: "Listing not found" }, { status: 404 });
    }
    if (listing.ownerId !== userId) {
      return Response.json({ error: "Only the listing host can submit location validation" }, { status: 403 });
    }

    const record = await upsertPropertyLocationValidation({
      listingId,
      latitude,
      longitude,
      address,
      validationStatus: "PENDING",
    });

    return Response.json({
      listing_id: record.listingId,
      latitude: record.latitude,
      longitude: record.longitude,
      address: record.address,
      validation_status: record.validationStatus.toLowerCase(),
      validated_at: record.validatedAt,
    });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Location validation failed" },
      { status: 500 }
    );
  }
}
