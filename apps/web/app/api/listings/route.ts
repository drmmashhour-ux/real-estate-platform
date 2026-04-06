import { NextRequest } from "next/server";
import { searchListings } from "@/lib/bnhub/listings";
import { createListing } from "@/lib/bnhub/listings";
import { getGuestId } from "@/lib/auth/session";
import { assertCanCreateListing } from "@/lib/compliance/professional-compliance";
import { AnalyticsEvents } from "@/lib/analytics/events";
import { captureServerEvent } from "@/lib/analytics/posthog-server";
import {
  logSearchRelevanceDebug,
  sortListingsBySearchRelevance,
} from "@/lib/bnhub/listings-search-relevance";

/**
 * GET /api/listings — Search listings (MVP alias for BNHub search).
 * Query: city, country, checkIn, checkOut, minPrice, maxPrice, guests, verifiedOnly, sort.
 * Default / newest: results are re-sorted by basic relevance (location, price fit, rating, completeness);
 * `sort=priceAsc|priceDesc|recommended` keeps the search layer order.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get("city") ?? undefined;
    const country = searchParams.get("country") ?? undefined;
    const checkIn = searchParams.get("checkIn") ?? undefined;
    const checkOut = searchParams.get("checkOut") ?? undefined;
    const minPriceRaw = searchParams.get("minPrice");
    const maxPriceRaw = searchParams.get("maxPrice");
    const minPrice =
      minPriceRaw != null && minPriceRaw !== "" && Number.isFinite(Number(minPriceRaw))
        ? Number(minPriceRaw)
        : undefined;
    const maxPrice =
      maxPriceRaw != null && maxPriceRaw !== "" && Number.isFinite(Number(maxPriceRaw))
        ? Number(maxPriceRaw)
        : undefined;
    const guests = searchParams.get("guests");
    const verifiedOnly = searchParams.get("verifiedOnly") === "true";
    const sort = searchParams.get("sort") ?? "newest";

    const listings = await searchListings({
      city,
      checkIn,
      checkOut,
      minPrice,
      maxPrice,
      guests: guests ? Number(guests) : undefined,
      verifiedOnly,
      sort: sort === "priceAsc" || sort === "priceDesc" || sort === "recommended" ? sort : "newest",
    });

    const preserveSearchOrder =
      sort === "priceAsc" || sort === "priceDesc" || sort === "recommended";

    const ordered = preserveSearchOrder
      ? listings
      : sortListingsBySearchRelevance(listings, { city, country, minPrice, maxPrice });

    if (!preserveSearchOrder) {
      logSearchRelevanceDebug(ordered, { city, country, minPrice, maxPrice });
    }

    return Response.json(ordered);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to fetch listings" }, { status: 500 });
  }
}

/**
 * POST /api/listings — Create listing (host). Uses session userId as owner.
 * Verification fields: title, description, address, city, province, cadastre_number, listing_authority_type.
 * Optional: country, nightPriceCents, beds, baths, maxGuests, photos, amenities, houseRules.
 */
export async function POST(request: NextRequest) {
  try {
    const ownerId = await getGuestId();
    if (!ownerId) return Response.json({ error: "Sign in required" }, { status: 401 });

    const body = await request.json();
    const {
      title,
      description,
      address,
      city,
      province,
      country,
      cadastre_number,
      listing_authority_type,
      nightPriceCents,
      beds,
      baths,
      maxGuests,
      photos,
      amenities,
      houseRules,
    } = body;
    if (!title || !address || !city) {
      return Response.json(
        { error: "title, address, city required" },
        { status: 400 }
      );
    }
    const listingAuthorityType =
      listing_authority_type === "broker" ? "BROKER" : listing_authority_type === "owner" ? "OWNER" : undefined;
    const createGate = await assertCanCreateListing({
      userId: ownerId,
      listingAuthorityType: listingAuthorityType ?? "OWNER",
      brokerLicenseNumber: null,
      brokerageName: null,
    });
    if (!createGate.ok) {
      return Response.json(
        { error: createGate.reasons.join(". ") || "Not permitted", reasons: createGate.reasons },
        { status: 403 }
      );
    }
    const listing = await createListing({
      ownerId,
      title,
      description: description ?? undefined,
      address,
      city,
      province: province ?? undefined,
      country,
      cadastreNumber: cadastre_number ?? undefined,
      listingAuthorityType,
      nightPriceCents: nightPriceCents != null ? Number(nightPriceCents) : 0,
      beds: beds != null ? Number(beds) : 1,
      baths: baths != null ? Number(baths) : 1,
      maxGuests: maxGuests != null ? Number(maxGuests) : undefined,
      photos: Array.isArray(photos) ? photos : [],
      amenities: Array.isArray(amenities) ? amenities : undefined,
      houseRules: typeof houseRules === "string" ? houseRules : undefined,
    });
    captureServerEvent(ownerId, AnalyticsEvents.LISTING_CREATED, {
      listingId: listing.id,
      source: "api_listings",
    });
    return Response.json(listing);
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to create listing" },
      { status: 400 }
    );
  }
}
