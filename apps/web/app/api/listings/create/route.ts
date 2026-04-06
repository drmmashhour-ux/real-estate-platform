import { NextRequest } from "next/server";
import { createListing } from "@/lib/bnhub/listings";
import { getGuestId } from "@/lib/auth/session";
import { assertCanCreateListing } from "@/lib/compliance/professional-compliance";
import { postCreateShortTermListingFlow } from "@/lib/bnhub/post-create-short-term-listing";

export const dynamic = "force-dynamic";

/**
 * Fast host wizard — minimal payload. Creates a BNHub `ShortTermListing` draft (or publish attempt).
 * Body: { title?, city, price (CAD/night), description?, amenities?, listingStatus?: "DRAFT" | "PUBLISHED" }
 */
export async function POST(req: NextRequest) {
  try {
    const ownerId = await getGuestId();
    if (!ownerId) {
      return Response.json({ error: "Sign in required" }, { status: 401 });
    }

    const body = (await req.json()) as Record<string, unknown>;
    const city = typeof body.city === "string" ? body.city.trim() : "";
    if (!city) {
      return Response.json({ error: "city is required" }, { status: 400 });
    }

    const titleRaw = typeof body.title === "string" ? body.title.trim() : "";
    const title = titleRaw || `Stay in ${city}`;

    const price = Number(body.price);
    if (!Number.isFinite(price) || price < 0) {
      return Response.json({ error: "price must be a non-negative number (CAD per night)" }, { status: 400 });
    }

    const description = typeof body.description === "string" ? body.description : "";
    const amenities = Array.isArray(body.amenities)
      ? body.amenities.filter((x): x is string => typeof x === "string")
      : [];

    const listingStatus =
      body.listingStatus === "PUBLISHED" ? ("PUBLISHED" as const) : ("DRAFT" as const);

    const address =
      typeof body.address === "string" && body.address.trim()
        ? body.address.trim()
        : `${city}, QC, Canada`;

    const createGate = await assertCanCreateListing({
      userId: ownerId,
      listingAuthorityType: "OWNER",
      brokerLicenseNumber: null,
      brokerageName: null,
    });
    if (!createGate.ok) {
      return Response.json(
        { error: createGate.reasons.join(". ") || "Listing creation not permitted", reasons: createGate.reasons },
        { status: 403 }
      );
    }

    const listing = await createListing({
      ownerId,
      title,
      description,
      address,
      city,
      region: "QC",
      country: "CA",
      currency: "CAD",
      nightPriceCents: Math.round(price * 100),
      beds: 1,
      baths: 1,
      maxGuests: 4,
      photos: [],
      amenities,
      listingAuthorityType: "OWNER",
      listingStatus,
    });

    const flow = await postCreateShortTermListingFlow({
      listing,
      ownerId,
      address,
      city,
      region: "QC",
      country: "CA",
      cadastreNumber: null,
      municipality: null,
      province: "QC",
      latitude: null,
      longitude: null,
      propertyType: null,
      source: "listing_wizard",
    });

    if (flow.publishError) {
      return Response.json(
        {
          error: flow.publishError,
          reasons: flow.publishReasons ?? [],
          listing: flow.listing,
          listingStatus: flow.listing.listingStatus,
        },
        { status: 400 }
      );
    }

    return Response.json({ listing: flow.listing });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to create listing" },
      { status: 400 }
    );
  }
}
