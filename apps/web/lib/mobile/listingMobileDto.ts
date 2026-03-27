import { ListingStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { effectiveListingSafety } from "./safetyPublic";

const listingCardSelect = {
  id: true,
  title: true,
  city: true,
  region: true,
  country: true,
  nightPriceCents: true,
  currency: true,
  maxGuests: true,
  beds: true,
  baths: true,
  latitude: true,
  longitude: true,
  listingCode: true,
  photos: true,
  instantBookEnabled: true,
  checkInTime: true,
  checkOutTime: true,
  minStayNights: true,
  maxStayNights: true,
  cancellationPolicy: true,
  houseRules: true,
  checkInInstructions: true,
  listingStatus: true,
  ownerId: true,
} as const;

const listingWithQualitySelect = {
  ...listingCardSelect,
  bnhubPropertyClassification: { select: { starRating: true, ratingLabel: true } },
  bnhubLuxuryTier: { select: { tierCode: true, eligibilityStatus: true } },
  bnhubListingSafetyProfile: true,
  listingPhotos: { select: { url: true, isCover: true, sortOrder: true }, orderBy: { sortOrder: "asc" as const } },
} as const;

export async function fetchListingCardWithQuality(listingId: string) {
  return prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: listingWithQualitySelect,
  });
}

export type ListingWithQualityRow = NonNullable<Awaited<ReturnType<typeof fetchListingCardWithQuality>>>;

export function toPublicListingCard(row: ListingWithQualityRow) {
  const safety = effectiveListingSafety(row.bnhubListingSafetyProfile);
  const tier =
    row.bnhubLuxuryTier &&
    row.bnhubLuxuryTier.tierCode !== "NONE" &&
    row.bnhubLuxuryTier.eligibilityStatus === "ELIGIBLE"
      ? row.bnhubLuxuryTier.tierCode
      : null;

  const photoUrls = row.listingPhotos.length
    ? row.listingPhotos.map((p) => p.url)
    : Array.isArray(row.photos)
      ? row.photos.filter((x): x is string => typeof x === "string")
      : [];

  return {
    id: row.id,
    title: row.title,
    city: row.city,
    region: row.region,
    country: row.country,
    nightPriceCents: row.nightPriceCents,
    currency: row.currency,
    maxGuests: row.maxGuests,
    beds: row.beds,
    baths: row.baths,
    lat: row.latitude,
    lng: row.longitude,
    listingCode: row.listingCode,
    photos: photoUrls.slice(0, 12),
    instantBookEnabled: row.instantBookEnabled,
    checkInTime: row.checkInTime,
    checkOutTime: row.checkOutTime,
    minStayNights: row.minStayNights,
    maxStayNights: row.maxStayNights,
    cancellationPolicy: row.cancellationPolicy,
    houseRules: row.houseRules,
    checkInInstructions: row.checkInInstructions,
    starRating: row.bnhubPropertyClassification?.starRating ?? null,
    ratingLabel:
      row.bnhubPropertyClassification?.ratingLabel ?? "BNHub Star Rating (internal platform estimate)",
    luxuryTierPublic: tier,
    safety: {
      guestMessage: safety.guestMessage,
      bookingAllowed: safety.bookingAllowed,
      listingVisible: safety.listingVisible,
      reviewStatus: safety.reviewStatus,
    },
  };
}

/** Single query for many ids — preserves `ids` order; skips missing/non-published. */
export async function fetchPublicListingCardsByIds(ids: string[]) {
  if (ids.length === 0) return [];
  const rows = await prisma.shortTermListing.findMany({
    where: { id: { in: ids }, listingStatus: ListingStatus.PUBLISHED },
    select: listingWithQualitySelect,
  });
  const map = new Map(rows.map((r) => [r.id, r]));
  const out: ReturnType<typeof toPublicListingCard>[] = [];
  for (const id of ids) {
    const row = map.get(id);
    if (row) out.push(toPublicListingCard(row));
  }
  return out;
}

export async function listPublishedListingIdsVisibleToGuest(where: object, take: number, skip = 0) {
  const rows = await prisma.shortTermListing.findMany({
    where: {
      ...where,
      listingStatus: ListingStatus.PUBLISHED,
    },
    select: { id: true, bnhubListingSafetyProfile: { select: { listingVisible: true } } },
    take,
    skip,
    orderBy: { updatedAt: "desc" },
  });
  return rows.filter((r) => {
    const v = r.bnhubListingSafetyProfile;
    if (!v) return true;
    return v.listingVisible;
  }).map((r) => r.id);
}
