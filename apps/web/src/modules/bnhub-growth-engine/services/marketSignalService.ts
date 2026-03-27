import { prisma } from "@/lib/db";
import { ListingStatus } from "@prisma/client";

/** Internal demand proxy: published listing density (placeholder for external comps). */
export async function getAreaDemandSignals(city: string): Promise<{
  publishedListingsInCity: number;
  demandIndex: number;
  note: string;
}> {
  const c = city.trim();
  if (!c) {
    return { publishedListingsInCity: 0, demandIndex: 50, note: "No city — neutral demand index." };
  }
  const publishedListingsInCity = await prisma.shortTermListing.count({
    where: { city: { equals: c, mode: "insensitive" }, listingStatus: ListingStatus.PUBLISHED },
  });
  const demandIndex = Math.min(100, 40 + Math.min(40, publishedListingsInCity * 2));
  return {
    publishedListingsInCity,
    demandIndex,
    note: "Demand index is a coarse internal proxy (listing density), not a market appraisal.",
  };
}

/** Placeholder until unified analytics events exist. */
export async function getViewToInquiryRatio(_listingId: string): Promise<{ ratio: number | null; note: string }> {
  return { ratio: null, note: "View events not wired — returning null." };
}

export async function getInquiryToBookingRatio(listingId: string): Promise<{ ratio: number | null; note: string }> {
  const [leads, bookings] = await Promise.all([
    prisma.bnhubLead.count({ where: { listingId } }),
    prisma.booking.count({ where: { listingId } }),
  ]);
  if (leads === 0) return { ratio: null, note: "No leads on record." };
  return { ratio: bookings / leads, note: "Ratio = bookings / internal leads (coarse)." };
}

export async function getLeadVolumeSignal(listingId: string): Promise<{ leadCount30d: number; note: string }> {
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const leadCount30d = await prisma.bnhubLead.count({
    where: { listingId, createdAt: { gte: since } },
  });
  return { leadCount30d, note: "Lead volume from bnhub_leads (30d)." };
}

export async function getBookingPerformanceSignal(listingId: string): Promise<{
  bookingCount12m: number;
  note: string;
}> {
  const since = new Date();
  since.setFullYear(since.getFullYear() - 1);
  const bookingCount12m = await prisma.booking.count({
    where: { listingId, createdAt: { gte: since } },
  });
  return { bookingCount12m, note: "Bookings in last 12 months." };
}

export function getSeasonalSignal(_listingId: string, _city: string): {
  multiplier: number;
  note: string;
} {
  const month = new Date().getMonth() + 1;
  const summer = month >= 6 && month <= 8 ? 1.06 : 1;
  const winterSkiPlaceholder = month === 12 || month <= 2 ? 1.03 : 1;
  return {
    multiplier: Math.min(1.08, summer * winterSkiPlaceholder),
    note: "Simple calendar seasonality placeholder — not destination-specific.",
  };
}

export function getEventSignalPlaceholder(_city: string): { multiplier: number; note: string } {
  return {
    multiplier: 1,
    note: "Event calendar not integrated — neutral multiplier.",
  };
}
