import { ListingAnalyticsKind, ListingStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export type AdminListingFilters = {
  search?: string;
  status?: ListingStatus;
  city?: string;
  hostId?: string;
  /** Property type / category (e.g. House, Apartment) — substring match */
  propertyType?: string;
  /** Listing has an active host-managed discount window */
  hasActivePromotion?: boolean;
  flaggedOnly?: boolean;
  missingPhotosOnly?: boolean;
};

export type AdminListingRow = {
  id: string;
  ownerId: string;
  listingCode: string;
  title: string;
  city: string;
  propertyType: string | null;
  listingStatus: ListingStatus;
  nightPriceCents: number;
  createdAt: Date;
  views: number;
  bookingCount: number;
  promotionCount: number;
  hostEmail: string | null;
  hostName: string | null;
  coverUrl: string | null;
  photoCount: number;
};

export async function getAdminListings(
  filters: AdminListingFilters = {},
  take = 120
): Promise<AdminListingRow[]> {
  const search = filters.search?.trim();

  const where: Prisma.ShortTermListingWhereInput = {};

  if (filters.status) where.listingStatus = filters.status;
  if (filters.city?.trim()) {
    where.city = { contains: filters.city.trim(), mode: "insensitive" };
  }
  if (filters.hostId?.trim()) where.ownerId = filters.hostId.trim();
  if (filters.propertyType?.trim()) {
    where.propertyType = { contains: filters.propertyType.trim(), mode: "insensitive" };
  }
  if (filters.hasActivePromotion) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    where.bnhubHostListingPromotions = {
      some: {
        active: true,
        startDate: { lte: today },
        endDate: { gte: today },
      },
    };
  }
  if (filters.flaggedOnly) {
    where.listingStatus = {
      in: [ListingStatus.UNDER_INVESTIGATION, ListingStatus.SUSPENDED, ListingStatus.FROZEN],
    };
  }

  const rows = await prisma.shortTermListing.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take,
    select: {
      id: true,
      ownerId: true,
      listingCode: true,
      title: true,
      city: true,
      propertyType: true,
      listingStatus: true,
      nightPriceCents: true,
      createdAt: true,
      owner: { select: { email: true, name: true } },
      listingPhotos: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true } },
      _count: {
        select: {
          listingPhotos: true,
          bookings: true,
          bnhubHostListingPromotions: true,
        },
      },
    },
  });

  const ids = rows.map((r) => r.id);
  const analytics = ids.length
    ? await prisma.listingAnalytics.findMany({
        where: { kind: ListingAnalyticsKind.BNHUB, listingId: { in: ids } },
        select: { listingId: true, viewsTotal: true },
      })
    : [];
  const viewsById = new Map(analytics.map((a) => [a.listingId, a.viewsTotal]));

  let out: AdminListingRow[] = rows.map((l) => ({
    id: l.id,
    ownerId: l.ownerId,
    listingCode: l.listingCode,
    title: l.title,
    city: l.city,
    propertyType: l.propertyType,
    listingStatus: l.listingStatus,
    nightPriceCents: l.nightPriceCents,
    createdAt: l.createdAt,
    views: viewsById.get(l.id) ?? 0,
    bookingCount: l._count.bookings,
    promotionCount: l._count.bnhubHostListingPromotions,
    hostEmail: l.owner.email,
    hostName: l.owner.name,
    coverUrl: l.listingPhotos[0]?.url ?? null,
    photoCount: l._count.listingPhotos,
  }));

  if (filters.missingPhotosOnly) {
    out = out.filter((r) => r.photoCount < 1);
  }

  if (search) {
    const q = search.toLowerCase();
    out = out.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.city.toLowerCase().includes(q) ||
        r.listingCode.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q) ||
        (r.hostEmail?.toLowerCase().includes(q) ?? false)
    );
  }

  return out;
}
