/**
 * BNHub launch — seed listings and dashboard aggregates (admin + fast host path).
 * Creates `ShortTermListing` rows directly to avoid broker regulatory gates on quick launch.
 */

import { ListingStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { allocateUniqueLSTListingCode } from "@/lib/listing-code";
import { scheduleBnhubListingEngineRefresh } from "@/src/modules/bnhub-growth-engine/services/bnhubListingEnginesOrchestrator";
import {
  validateBnhubLaunchListingQuality,
  BNHUB_LAUNCH_TAG_NEW,
  BNHUB_LAUNCH_TAG_SPECIAL,
} from "@/lib/bnhub/bnhub-launch-quality";

export type CreateQuickBnhubListingInput = {
  ownerId: string;
  title: string;
  city: string;
  address: string;
  country?: string;
  description: string;
  nightPriceCents: number;
  photos: string[];
  amenities: string[];
  listingStatus?: ListingStatus;
  /** Merged into `experienceTags` JSON */
  experienceTags?: string[];
};

export async function createQuickBnhubListingRecord(input: CreateQuickBnhubListingInput) {
  const q = validateBnhubLaunchListingQuality({
    description: input.description,
    photos: input.photos,
    amenities: input.amenities,
  });
  if (!q.ok) {
    throw new Error(q.errors.join(" "));
  }

  const listing = await prisma.$transaction(async (tx) => {
    const listingCode = await allocateUniqueLSTListingCode(tx);
    return tx.shortTermListing.create({
      data: {
        listingCode,
        ownerId: input.ownerId,
        title: input.title.trim(),
        description: input.description.trim(),
        address: input.address.trim(),
        city: input.city.trim(),
        country: (input.country ?? "CA").trim() || "CA",
        nightPriceCents: Math.max(100, Math.round(input.nightPriceCents)),
        currency: "CAD",
        beds: 1,
        baths: 1,
        maxGuests: 4,
        photos: input.photos as unknown as Prisma.InputJsonValue,
        amenities: input.amenities as unknown as Prisma.InputJsonValue,
        listingStatus: input.listingStatus ?? ListingStatus.PUBLISHED,
        experienceTags: (input.experienceTags ?? []) as unknown as Prisma.InputJsonValue,
      },
    });
  });

  scheduleBnhubListingEngineRefresh(listing.id);
  return listing;
}

function resolveLaunchTargetListings(): number {
  const raw = Number(process.env.BNHUB_LAUNCH_TARGET_LISTINGS ?? "15");
  if (!Number.isFinite(raw)) return 15;
  return Math.min(20, Math.max(10, Math.round(raw)));
}

export async function loadBnhubLaunchDashboardRows() {
  const [publishedCount, draftCount, hostRows, bookingCount, listings] = await Promise.all([
    prisma.shortTermListing.count({ where: { listingStatus: ListingStatus.PUBLISHED } }),
    prisma.shortTermListing.count({ where: { listingStatus: ListingStatus.DRAFT } }),
    prisma.shortTermListing.groupBy({
      by: ["ownerId"],
      where: { listingStatus: ListingStatus.PUBLISHED },
      _count: { ownerId: true },
    }),
    prisma.booking.count(),
    prisma.shortTermListing.findMany({
      where: { listingStatus: ListingStatus.PUBLISHED },
      orderBy: { createdAt: "desc" },
      take: 40,
      select: {
        id: true,
        listingCode: true,
        title: true,
        city: true,
        nightPriceCents: true,
        ownerId: true,
        createdAt: true,
        experienceTags: true,
        reputationRankBoost: true,
        _count: { select: { bookings: true } },
        owner: { select: { email: true, name: true } },
      },
    }),
  ]);

  const activeHosts = hostRows.length;
  const targetListings = resolveLaunchTargetListings();
  const gap = Math.max(0, targetListings - publishedCount);

  const table = listings.map((l) => ({
    id: l.id,
    listingCode: l.listingCode,
    title: l.title,
    city: l.city,
    nightPriceCents: l.nightPriceCents,
    ownerId: l.ownerId,
    hostEmail: l.owner.email,
    hostName: l.owner.name,
    bookings: l._count.bookings,
    createdAt: l.createdAt.toISOString(),
    experienceTags: Array.isArray(l.experienceTags)
      ? l.experienceTags.filter((x): x is string => typeof x === "string")
      : [],
    reputationRankBoost: l.reputationRankBoost,
  }));

  return {
    publishedCount,
    draftCount,
    activeHosts,
    bookingCount,
    targetListings,
    gapToTarget: gap,
    listings: table,
  };
}

export async function applyBnhubLaunchPromotionFlags(input: {
  listingId: string;
  newListing: boolean;
  specialOffer: boolean;
  visibilityBoost: boolean;
  /** When set, reduces current nightly price by this percent once (launch promo). */
  discountPercent?: number | null;
  /**
   * Only adjust rank boost and/or discount — do not rewrite launch tags.
   * Use for “boost visibility” without touching New/Special badges.
   */
  visibilityOnly?: boolean;
}) {
  const row = await prisma.shortTermListing.findUnique({
    where: { id: input.listingId },
    select: { experienceTags: true, nightPriceCents: true, reputationRankBoost: true },
  });
  if (!row) throw new Error("Listing not found");

  if (input.visibilityOnly) {
    const update: Prisma.ShortTermListingUpdateInput = {};
    if (input.visibilityBoost) {
      update.reputationRankBoost = 0.08;
    }
    if (input.discountPercent != null && input.discountPercent > 0 && input.discountPercent < 75) {
      const next = Math.round(row.nightPriceCents * (1 - input.discountPercent / 100));
      update.nightPriceCents = Math.max(100, next);
    }
    if (Object.keys(update).length === 0) {
      throw new Error("visibilityOnly requires visibilityBoost and/or discountPercent");
    }
    return prisma.shortTermListing.update({
      where: { id: input.listingId },
      data: update,
    });
  }

  const existing = Array.isArray(row.experienceTags)
    ? row.experienceTags.filter((x): x is string => typeof x === "string")
    : [];
  let tags = existing.filter((t) => t !== BNHUB_LAUNCH_TAG_NEW && t !== BNHUB_LAUNCH_TAG_SPECIAL);
  if (input.newListing) tags.push(BNHUB_LAUNCH_TAG_NEW);
  if (input.specialOffer) tags.push(BNHUB_LAUNCH_TAG_SPECIAL);
  tags = [...new Set(tags)];

  const update: Prisma.ShortTermListingUpdateInput = {
    experienceTags: tags as unknown as Prisma.InputJsonValue,
    reputationRankBoost: input.visibilityBoost ? 0.08 : 0,
  };

  if (input.discountPercent != null && input.discountPercent > 0 && input.discountPercent < 75) {
    const next = Math.round(row.nightPriceCents * (1 - input.discountPercent / 100));
    update.nightPriceCents = Math.max(100, next);
  }

  return prisma.shortTermListing.update({
    where: { id: input.listingId },
    data: update,
  });
}
