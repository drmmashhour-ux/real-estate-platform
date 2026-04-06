import type { BookingStatus, Prisma, PrismaClient } from "@prisma/client";
import { ListingStatus } from "@prisma/client";
import { FSBO_MODERATION, FSBO_STATUS } from "@/lib/fsbo/constants";
import { bnhubCityMatchWhere, fsboCityMatchWhere, leadCityMatchWhere } from "./cityMatchWhere";

const ACTIVE_BOOKING: BookingStatus[] = ["CONFIRMED", "COMPLETED"];

export type CitySupplyDemandSnapshot = {
  activeFsboListings: number;
  publishedBnhubListings: number;
  activeListings: number;
  hostsDistinct: number;
  bookings90d: number;
  leads90d: number;
  usersInMarket: number;
  revenueCents90d: number;
  buyerToListingRatio: number;
  bookingsPerHost: number;
};

function termsForCity(row: { cityMatchTerms: string[]; slug: string; name: string }): string[] {
  const raw = row.cityMatchTerms?.length ? row.cityMatchTerms : [row.slug.replace(/-/g, " "), row.name];
  return [...new Set(raw.map((s) => s.trim()).filter(Boolean))];
}

export async function getCitySupplyDemandSnapshot(
  db: PrismaClient,
  row: { cityMatchTerms: string[]; slug: string; name: string; id: string }
): Promise<CitySupplyDemandSnapshot> {
  const terms = termsForCity(row);
  const fsboWhere: Prisma.FsboListingWhereInput = {
    AND: [{ status: FSBO_STATUS.ACTIVE }, { moderationStatus: FSBO_MODERATION.APPROVED }, fsboCityMatchWhere(terms)],
  };
  const bnWhere: Prisma.ShortTermListingWhereInput = {
    listingStatus: ListingStatus.PUBLISHED,
    ...bnhubCityMatchWhere(terms),
  };
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 90);

  const leadWhere: Prisma.LeadWhereInput = {
    createdAt: { gte: since },
    ...leadCityMatchWhere(terms),
  };

  const [
    activeFsboListings,
    publishedBnhubListings,
    hostsDistinct,
    bookingsAgg,
    leads90d,
    usersInMarket,
    revenueAgg,
  ] = await Promise.all([
    db.fsboListing.count({ where: fsboWhere }),
    db.shortTermListing.count({ where: bnWhere }),
    db.shortTermListing.groupBy({
      by: ["ownerId"],
      where: bnWhere,
    }),
    db.booking.aggregate({
      where: {
        status: { in: ACTIVE_BOOKING },
        checkIn: { gte: since },
        listing: bnhubCityMatchWhere(terms),
      },
      _count: { _all: true },
      _sum: { totalCents: true },
    }),
    db.lead.count({ where: leadWhere }),
    db.user.count({ where: { lecipmCityId: row.id } }),
    db.booking.aggregate({
      where: {
        status: { in: ACTIVE_BOOKING },
        checkIn: { gte: since },
        listing: bnhubCityMatchWhere(terms),
      },
      _sum: { totalCents: true },
    }),
  ]);

  const activeListings = activeFsboListings + publishedBnhubListings;
  const bookings90d = bookingsAgg._count._all;
  const revenueCents90d = revenueAgg._sum.totalCents ?? 0;
  const buyerToListingRatio = activeListings > 0 ? leads90d / activeListings : leads90d;
  const hostCount = hostsDistinct.length;
  const bookingsPerHost = hostCount > 0 ? bookings90d / hostCount : bookings90d;

  return {
    activeFsboListings,
    publishedBnhubListings,
    activeListings,
    hostsDistinct: hostCount,
    bookings90d,
    leads90d,
    usersInMarket,
    revenueCents90d,
    buyerToListingRatio,
    bookingsPerHost,
  };
}
