import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { HostPublishIdentityError } from "@/lib/compliance/goLive";
import { prisma } from "@/lib/db";
import { ListingStatus } from "@prisma/client";
import {
  launchTagsFromFlags,
  parseAmenitiesList,
  parsePhotoUrls,
} from "@/lib/bnhub/bnhub-launch-quality";
import { createQuickBnhubListingRecord } from "@/lib/bnhub/bnhub-launch-service";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const adminId = await getGuestId();
  if (!adminId || !(await isPlatformAdmin(adminId))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const ownerEmail = typeof body.ownerEmail === "string" ? body.ownerEmail.trim() : "";
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const city = typeof body.city === "string" ? body.city.trim() : "";
  const address = typeof body.address === "string" ? body.address.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const priceRaw = body.price;
  const price = typeof priceRaw === "number" ? priceRaw : Number(priceRaw);
  const photosRaw = typeof body.photos === "string" ? body.photos : "";
  const amenitiesRaw = typeof body.amenities === "string" ? body.amenities : "";
  const publish = body.publish === true;
  const flagNew = body.flagNewListing === true;
  const flagSpecial = body.flagSpecialOffer === true;

  if (!ownerEmail || !title || !city || !address || !description) {
    return Response.json(
      { error: "ownerEmail, title, city, address, and description are required" },
      { status: 400 },
    );
  }
  if (!Number.isFinite(price) || price < 1) {
    return Response.json({ error: "price (per night, major units) must be a positive number" }, { status: 400 });
  }

  const owner = await prisma.user.findFirst({
    where: { email: { equals: ownerEmail, mode: "insensitive" } },
    select: { id: true },
  });
  if (!owner) {
    return Response.json({ error: `No user found with email ${ownerEmail}` }, { status: 404 });
  }

  const photos = parsePhotoUrls(photosRaw);
  const amenities = parseAmenitiesList(amenitiesRaw);
  const tags = launchTagsFromFlags({ newListing: flagNew, specialOffer: flagSpecial });

  try {
    const listing = await createQuickBnhubListingRecord({
      ownerId: owner.id,
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
    if (e instanceof HostPublishIdentityError) {
      return Response.json({ error: e.message }, { status: 403 });
    }
    const msg = e instanceof Error ? e.message : "Create failed";
    return Response.json({ error: msg }, { status: 400 });
  }
}
