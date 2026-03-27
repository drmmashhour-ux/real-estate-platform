/**
 * BNHub (short-term rental) index – nightly rate, occupancy, revenue, rating by region/period.
 */

import { prisma } from "@/lib/db";

export async function computeBnhubIndexForRegion(
  marketRegionId: string,
  period: string
): Promise<{
  averageNightlyRate: number | null;
  averageOccupancy: number | null;
  averageMonthlyRevenue: number | null;
  averageRating: number | null;
  sampleSize: number;
}> {
  const propertyIds = await prisma.propertyIdentity.findMany({
    where: { marketRegionId },
    select: { id: true },
  }).then((r) => r.map((p) => p.id));
  if (propertyIds.length === 0) {
    return {
      averageNightlyRate: null,
      averageOccupancy: null,
      averageMonthlyRevenue: null,
      averageRating: null,
      sampleSize: 0,
    };
  }

  const listingIds = await prisma.shortTermListing.findMany({
    where: { propertyIdentityId: { in: propertyIds } },
    select: { id: true, nightPriceCents: true },
  });
  const lidSet = new Set(listingIds.map((l) => l.id));
  if (lidSet.size === 0) {
    return {
      averageNightlyRate: listingIds.length > 0 ? Math.round(listingIds.reduce((a, l) => a + l.nightPriceCents, 0) / listingIds.length) : null,
      averageOccupancy: null,
      averageMonthlyRevenue: null,
      averageRating: null,
      sampleSize: listingIds.length,
    };
  }

  const [year, month] = period.split("-").map(Number);
  const periodStart = new Date(year, month - 1, 1);
  const periodEnd = new Date(year, month, 0, 23, 59, 59);

  const completed = await prisma.booking.findMany({
    where: {
      listingId: { in: Array.from(lidSet) },
      status: "COMPLETED",
      checkIn: { gte: periodStart, lte: periodEnd },
    },
    select: {
      totalCents: true,
      nights: true,
      listingId: true,
      listing: { select: { nightPriceCents: true } },
    },
  });

  const nightlyRates = listingIds.map((l) => l.nightPriceCents);
  const averageNightlyRate =
    nightlyRates.length > 0 ? Math.round(nightlyRates.reduce((a, b) => a + b, 0) / nightlyRates.length) : null;

  let totalRevenue = 0;
  let totalNights = 0;
  const daysInMonth = new Date(year, month, 0).getDate();
  const totalListingNights = lidSet.size * daysInMonth;
  for (const b of completed) {
    totalRevenue += b.totalCents;
    totalNights += b.nights;
  }
  const averageMonthlyRevenue = completed.length > 0 ? Math.round(totalRevenue / completed.length) : null;
  const averageOccupancy =
    totalListingNights > 0 && totalNights > 0 ? Math.round((totalNights / totalListingNights) * 1000) / 1000 : null;

  const reviews = await prisma.review.findMany({
    where: {
      listingId: { in: Array.from(lidSet) },
      createdAt: { gte: periodStart, lte: periodEnd },
    },
    select: { propertyRating: true },
  });
  const averageRating =
    reviews.length > 0 ? Math.round((reviews.reduce((a, r) => a + r.propertyRating, 0) / reviews.length) * 100) / 100 : null;

  return {
    averageNightlyRate,
    averageOccupancy,
    averageMonthlyRevenue,
    averageRating,
    sampleSize: completed.length || listingIds.length,
  };
}

export async function upsertBnhubIndex(
  marketRegionId: string,
  period: string,
  data: {
    averageNightlyRate?: number | null;
    averageOccupancy?: number | null;
    averageMonthlyRevenue?: number | null;
    averageRating?: number | null;
    sampleSize?: number | null;
  }
) {
  return prisma.marketBnhubIndex.upsert({
    where: { marketRegionId_period: { marketRegionId, period } },
    create: {
      marketRegionId,
      period,
      averageNightlyRate: data.averageNightlyRate ?? undefined,
      averageOccupancy: data.averageOccupancy ?? undefined,
      averageMonthlyRevenue: data.averageMonthlyRevenue ?? undefined,
      averageRating: data.averageRating ?? undefined,
      sampleSize: data.sampleSize ?? undefined,
    },
    update: {
      averageNightlyRate: data.averageNightlyRate ?? undefined,
      averageOccupancy: data.averageOccupancy ?? undefined,
      averageMonthlyRevenue: data.averageMonthlyRevenue ?? undefined,
      averageRating: data.averageRating ?? undefined,
      sampleSize: data.sampleSize ?? undefined,
    },
  });
}

export async function getBnhubIndex(marketRegionId: string, options?: { limit?: number }) {
  return prisma.marketBnhubIndex.findMany({
    where: { marketRegionId },
    orderBy: { period: "desc" },
    take: options?.limit ?? 24,
  });
}
