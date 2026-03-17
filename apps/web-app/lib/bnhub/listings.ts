import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { getRankingWeights, computeListingRankScore } from "./search-ranking";
import { getActivePromotedListingIds } from "@/lib/promotions";

export type ListingSearchParams = {
  city?: string;
  checkIn?: string; // ISO date
  checkOut?: string; // ISO date
  minPrice?: number;
  maxPrice?: number;
  guests?: number;
  verifiedOnly?: boolean;
  propertyType?: string;
  roomType?: string;
  instantBook?: boolean;
  /** newest | priceAsc | priceDesc | recommended */
  sort?: string;
};

export async function searchListings(params: ListingSearchParams) {
  const {
    city,
    checkIn,
    checkOut,
    minPrice,
    maxPrice,
    guests = 1,
    verifiedOnly,
    propertyType,
    roomType,
    instantBook,
    sort = "newest",
  } = params;

  const where: Prisma.ShortTermListingWhereInput = {};

  if (city?.trim()) where.city = { contains: city.trim(), mode: "insensitive" };
  if (minPrice != null || maxPrice != null) {
    where.nightPriceCents = {
      ...(minPrice != null && { gte: minPrice * 100 }),
      ...(maxPrice != null && { lte: maxPrice * 100 }),
    };
  }
  if (guests > 0) where.maxGuests = { gte: guests };
  if (verifiedOnly) where.verificationStatus = "VERIFIED";
  if (propertyType?.trim()) where.propertyType = { equals: propertyType.trim(), mode: "insensitive" };
  if (roomType?.trim()) where.roomType = { equals: roomType.trim(), mode: "insensitive" };
  if (instantBook === true) where.instantBookEnabled = true;
  where.listingStatus = "PUBLISHED";

  const orderBy: Prisma.ShortTermListingOrderByWithRelationInput[] =
    sort === "recommended"
      ? [] // Will sort in memory by ranking score
      : sort === "priceAsc"
        ? [{ nightPriceCents: "asc" }]
        : sort === "priceDesc"
          ? [{ nightPriceCents: "desc" }]
          : [{ createdAt: "desc" }];

  const listings = await prisma.shortTermListing.findMany({
    where,
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          hostQuality: true,
        },
      },
      _count: { select: { reviews: true, bookings: true } },
      reviews: { select: { propertyRating: true } },
    },
    orderBy: orderBy.length > 0 ? orderBy : [{ createdAt: "desc" }],
  });

  let result = listings;

  if (sort === "recommended") {
    const weights = await getRankingWeights();
    result = [...listings].sort(
      (a, b) => computeListingRankScore(b, weights) - computeListingRankScore(a, weights)
    );
  }

  const featuredIds = await getActivePromotedListingIds({ placement: "FEATURED", limit: 20 });
  if (featuredIds.length > 0) {
    const promoted = result.filter((l) => featuredIds.includes(l.id));
    const rest = result.filter((l) => !featuredIds.includes(l.id));
    const order = [...featuredIds];
    result = [...promoted].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id)).concat(rest);
  }

  if (checkIn && checkOut) {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const available: typeof result = [];
    for (const listing of result) {
      const isAvailable = await isListingAvailable(listing.id, checkInDate, checkOutDate);
      if (isAvailable) available.push(listing);
    }
    return available;
  }

  return result;
}

/** Get ordered photo URLs for a listing (BnhubListingPhoto first, then legacy photos). */
export async function getListingPhotoUrls(listingId: string): Promise<string[]> {
  const photos = await prisma.bnhubListingPhoto.findMany({
    where: { listingId },
    orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }],
  });
  if (photos.length > 0) return photos.map((p) => p.url);
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: { photos: true },
  });
  return listing?.photos ?? [];
}

export async function getListingById(id: string) {
  return prisma.shortTermListing.findUnique({
    where: { id },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          hostQuality: true,
        },
      },
      listingPhotos: { orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }] },
      _count: { select: { reviews: true } },
      reviews: {
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { guest: { select: { name: true } } },
      },
    },
  });
}

export async function isListingAvailable(
  listingId: string,
  checkIn: Date,
  checkOut: Date
): Promise<boolean> {
  // Block if any active/reserved booking overlaps (avoid double-booking)
  const overlapping = await prisma.booking.findFirst({
    where: {
      listingId,
      status: { in: ["CONFIRMED", "PENDING", "AWAITING_HOST_APPROVAL"] },
      OR: [
        { checkIn: { lte: checkIn }, checkOut: { gt: checkIn } },
        { checkIn: { lt: checkOut }, checkOut: { gte: checkOut } },
        { checkIn: { gte: checkIn }, checkOut: { lte: checkOut } },
      ],
    },
  });
  if (overlapping) return false;
  // Block if any night in range is explicitly blocked in calendar
  const start = new Date(checkIn);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(checkOut);
  end.setUTCHours(0, 0, 0, 0);
  const blockedSlot = await prisma.availabilitySlot.findFirst({
    where: {
      listingId,
      date: { gte: start, lt: end },
      available: false,
    },
  });
  return !blockedSlot;
}

export async function getAvailability(listingId: string, start: Date, end: Date) {
  const slots = await prisma.availabilitySlot.findMany({
    where: { listingId, date: { gte: start, lte: end } },
    orderBy: { date: "asc" },
  });
  return slots;
}

export async function setAvailability(
  listingId: string,
  date: Date,
  available: boolean
) {
  const dateOnly = new Date(date);
  dateOnly.setUTCHours(0, 0, 0, 0);
  return prisma.availabilitySlot.upsert({
    where: {
      listingId_date: { listingId, date: dateOnly },
    },
    create: { listingId, date: dateOnly, available },
    update: { available },
  });
}

export type CreateListingData = {
  ownerId: string;
  title: string;
  subtitle?: string;
  description?: string;
  propertyType?: string;
  roomType?: string;
  category?: string;
  address: string;
  city: string;
  region?: string;
  country?: string;
  nightPriceCents: number;
  currency?: string;
  beds: number;
  bedrooms?: number;
  baths: number;
  maxGuests?: number;
  photos: string[];
  amenities?: string[];
  houseRules?: string;
  checkInInstructions?: string;
  checkInTime?: string;
  checkOutTime?: string;
  cancellationPolicy?: string;
  cleaningFeeCents?: number;
  securityDepositCents?: number;
  taxRatePercent?: number;
  instantBookEnabled?: boolean;
  minStayNights?: number;
  maxStayNights?: number;
  listingStatus?: "DRAFT" | "PUBLISHED" | "UNLISTED" | "SUSPENDED" | "UNDER_INVESTIGATION";
  safetyFeatures?: string[];
  accessibilityFeatures?: string[];
  parkingDetails?: string;
  neighborhoodDetails?: string;
  listingAuthorityType?: "OWNER" | "BROKER";
  cadastreNumber?: string;
  municipality?: string;
  province?: string;
  brokerLicenseNumber?: string;
  brokerageName?: string;
};

export async function createListing(data: CreateListingData) {
  return prisma.shortTermListing.create({
    data: {
      ownerId: data.ownerId,
      title: data.title,
      subtitle: data.subtitle,
      description: data.description,
      propertyType: data.propertyType,
      roomType: data.roomType,
      category: data.category,
      address: data.address,
      city: data.city,
      region: data.region,
      country: data.country ?? "US",
      currency: data.currency ?? "USD",
      nightPriceCents: data.nightPriceCents,
      beds: data.beds,
      bedrooms: data.bedrooms,
      baths: data.baths,
      maxGuests: data.maxGuests ?? 4,
      photos: data.photos ?? [],
      amenities: data.amenities ?? [],
      houseRules: data.houseRules,
      checkInInstructions: data.checkInInstructions,
      checkInTime: data.checkInTime,
      checkOutTime: data.checkOutTime,
      cancellationPolicy: data.cancellationPolicy,
      cleaningFeeCents: data.cleaningFeeCents ?? 0,
      securityDepositCents: data.securityDepositCents ?? 0,
      taxRatePercent: data.taxRatePercent,
      instantBookEnabled: data.instantBookEnabled ?? false,
      minStayNights: data.minStayNights,
      maxStayNights: data.maxStayNights,
      listingStatus: data.listingStatus ?? "DRAFT",
      safetyFeatures: data.safetyFeatures ?? [],
      accessibilityFeatures: data.accessibilityFeatures ?? [],
      parkingDetails: data.parkingDetails,
      neighborhoodDetails: data.neighborhoodDetails,
      listingAuthorityType: data.listingAuthorityType ?? null,
      cadastreNumber: data.cadastreNumber?.trim() || null,
      municipality: data.municipality?.trim() || null,
      province: data.province?.trim() || null,
      brokerLicenseNumber: data.brokerLicenseNumber?.trim() || null,
      brokerageName: data.brokerageName?.trim() || null,
    },
  });
}

export type UpdateListingData = Partial<{
  title: string;
  subtitle: string;
  description: string;
  propertyType: string;
  roomType: string;
  category: string;
  address: string;
  city: string;
  region: string;
  country: string;
  nightPriceCents: number;
  currency: string;
  beds: number;
  bedrooms: number;
  baths: number;
  maxGuests: number;
  photos: string[];
  amenities: string[];
  houseRules: string;
  checkInInstructions: string;
  checkInTime: string;
  checkOutTime: string;
  cancellationPolicy: string;
  cleaningFeeCents: number;
  securityDepositCents: number;
  taxRatePercent: number;
  instantBookEnabled: boolean;
  minStayNights: number;
  maxStayNights: number;
  listingStatus: "DRAFT" | "PUBLISHED" | "UNLISTED" | "SUSPENDED" | "UNDER_INVESTIGATION";
  safetyFeatures: string[];
  accessibilityFeatures: string[];
  parkingDetails: string;
  neighborhoodDetails: string;
  listingAuthorityType: "OWNER" | "BROKER";
  cadastreNumber: string;
  municipality: string;
  province: string;
  brokerLicenseNumber: string;
  brokerageName: string;
}>;

export async function updateListing(id: string, data: UpdateListingData) {
  return prisma.shortTermListing.update({
    where: { id },
    data,
  });
}

/** Set or replace listing photos with order and cover. */
export async function setListingPhotos(
  listingId: string,
  photos: { url: string; sortOrder?: number; isCover?: boolean }[]
) {
  await prisma.bnhubListingPhoto.deleteMany({ where: { listingId } });
  if (photos.length === 0) return [];
  const hasExplicitCover = photos.some((p) => p.isCover);
  await prisma.bnhubListingPhoto.createMany({
    data: photos.map((p, i) => ({
      listingId,
      url: p.url,
      sortOrder: p.sortOrder ?? i,
      isCover: p.isCover === true || (!hasExplicitCover && i === 0),
    })),
  });
  return prisma.bnhubListingPhoto.findMany({
    where: { listingId },
    orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }],
  });
}

export async function getListingsByOwner(ownerId: string) {
  return prisma.shortTermListing.findMany({
    where: { ownerId },
    include: {
      _count: { select: { bookings: true, reviews: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}
