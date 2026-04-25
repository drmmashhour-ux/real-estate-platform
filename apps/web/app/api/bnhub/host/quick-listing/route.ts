import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { ListingStatus } from "@prisma/client";
import {
  launchTagsFromFlags,
  parseAmenitiesList,
  parsePhotoUrls,
} from "@/lib/bnhub/bnhub-launch-quality";
import { createQuickBnhubListingRecord } from "@/lib/bnhub/bnhub-launch-service";

export const dynamic = "force-dynamic";

/**
 * Fast host onboarding publish — minimal fields, launch quality bar.
 * Body: title, city, address?, description, price (nightly major units), photos (multiline URLs), amenities (comma list), publish?, flags
 */
export async function POST(request: NextRequest) {
  const userId = await getGuestId();
  if (!userId) {
    return Response.json({ error: "Sign in required" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const city = typeof body.city === "string" ? body.city.trim() : "";
  const address =
    typeof body.address === "string" && body.address.trim()
      ? body.address.trim()
      : `${city} — quick listing`;
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const priceRaw = body.price;
  const price = typeof priceRaw === "number" ? priceRaw : Number(priceRaw);
  const photosRaw = typeof body.photos === "string" ? body.photos : "";
  const amenitiesRaw = typeof body.amenities === "string" ? body.amenities : "";
  const publish = body.publish !== false;
  const flagNew = body.flagNewListing !== false;
  const flagSpecial = body.flagSpecialOffer === true;

  if (!title || !city || !description) {
    return Response.json({ error: "title, city, and description are required" }, { status: 400 });
  }
  if (!Number.isFinite(price) || price < 1) {
    return Response.json({ error: "price must be a positive number (per night)" }, { status: 400 });
  }

  const photos = parsePhotoUrls(photosRaw);
  const amenities = parseAmenitiesList(amenitiesRaw);
  const tags = launchTagsFromFlags({ newListing: flagNew, specialOffer: flagSpecial });

  try {
    const listing = await createQuickBnhubListingRecord({
      ownerId: userId,
      title,
      city,
      address,
      country: typeof body.country === "string" ? body.country : "CA",
      description,
      nightPriceCents: Math.round(price * 100),
      photos,
      amenities,
      listingStatus: publish ? ListingStatus.PUBLISHED : ListingStatus.DRAFT,
      experienceTags: tags,
    });
    return Response.json({
      ok: true,
      listingId: listing.id,
      listingCode: listing.listingCode,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Create failed";
    return Response.json({ error: msg }, { status: 400 });
  }
}
