import { createListing } from "@/lib/bnhub/listings";
import { assertCanCreateListing } from "@/lib/compliance/professional-compliance";
import { postCreateShortTermListingFlow } from "@/lib/bnhub/post-create-short-term-listing";

export type CreateHostDraftInput = {
  title: string;
  city: string;
  address?: string;
  propertyType?: string;
  roomType?: string;
  maxGuests?: number;
  bedrooms?: number;
  beds?: number;
  baths?: number;
};

export async function createHostListingDraft(ownerId: string, input: CreateHostDraftInput) {
  const gate = await assertCanCreateListing({
    userId: ownerId,
    listingAuthorityType: "OWNER",
    brokerLicenseNumber: null,
    brokerageName: null,
  });
  if (!gate.ok) {
    return { ok: false as const, status: 403, error: gate.reasons.join(". ") || "You can’t create a listing yet.", reasons: gate.reasons };
  }

  const title = input.title.trim();
  const city = input.city.trim();
  const address = input.address?.trim() || `${city}, QC, Canada`;
  const propertyType = input.propertyType?.trim() || "Apartment";
  const roomType = input.roomType?.trim() || "Entire place";
  const maxGuests = input.maxGuests != null ? Math.max(1, parseInt(String(input.maxGuests), 10) || 2) : 2;
  const bedrooms = input.bedrooms != null ? Math.max(0, parseInt(String(input.bedrooms), 10) || 1) : 1;
  const beds = input.beds != null ? Math.max(1, parseInt(String(input.beds), 10) || 1) : 1;
  const baths = input.baths != null ? Math.max(0.5, Number(input.baths) || 1) : 1;

  const listing = await createListing({
    ownerId,
    title,
    description: "",
    address,
    city,
    region: "QC",
    country: "CA",
    currency: "CAD",
    nightPriceCents: 13_900,
    roomType,
    beds,
    bedrooms,
    baths,
    maxGuests,
    photos: [],
    amenities: [],
    propertyType,
    listingAuthorityType: "OWNER",
    listingStatus: "DRAFT",
  });

  await postCreateShortTermListingFlow({
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
    propertyType,
    source: "host_wizard_draft",
  });

  return { ok: true as const, id: listing.id, listingCode: listing.listingCode };
}
