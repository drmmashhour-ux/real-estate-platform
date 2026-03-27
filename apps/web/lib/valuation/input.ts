import { prisma } from "@/lib/db";
import type { PropertyInput } from "./types";

export async function buildPropertyInput(
  propertyIdentityId: string,
  listingId?: string | null
): Promise<PropertyInput | null> {
  const identity = await prisma.propertyIdentity.findUnique({
    where: { id: propertyIdentityId },
    select: {
      id: true,
      cadastreNumber: true,
      officialAddress: true,
      municipality: true,
      province: true,
      propertyType: true,
      latitude: true,
      longitude: true,
    },
  });
  if (!identity) return null;

  let listing: { beds: number; baths: number; nightPriceCents: number } | null = null;
  if (listingId) {
    const l = await prisma.shortTermListing.findUnique({
      where: { id: listingId },
      select: { beds: true, baths: true, nightPriceCents: true },
    });
    if (l) listing = l;
  }
  if (!listing) {
    const first = await prisma.shortTermListing.findFirst({
      where: { propertyIdentityId },
      select: { id: true, beds: true, baths: true, nightPriceCents: true },
    });
    if (first) listing = first;
  }

  const input: PropertyInput = {
    propertyIdentityId: identity.id,
    listingId: listingId ?? undefined,
    cadastreNumber: identity.cadastreNumber,
    address: identity.officialAddress,
    city: identity.municipality ?? "",
    municipality: identity.municipality,
    province: identity.province,
    propertyType: identity.propertyType,
    latitude: identity.latitude,
    longitude: identity.longitude,
  };
  if (listing) {
    input.bedrooms = listing.beds;
    input.bathrooms = listing.baths;
  }
  return input;
}
