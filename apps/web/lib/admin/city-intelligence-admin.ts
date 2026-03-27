/**
 * Admin-only aggregates: booking revenue/volume by normalized city bucket.
 * Uses a bounded recent sample for performance on serverless.
 */

import { prisma } from "@/lib/db";
import { getCityInsights } from "@/lib/city-insights";
import { CITY_SLUGS, type CitySlug } from "@/lib/geo/city-search";

const BOOKING_SAMPLE = 2500;

function normalizeCityToSlug(city: string): CitySlug | null {
  const t = city.trim().toLowerCase();
  if (t.includes("laval")) return "laval";
  if (t.includes("montréal") || t.includes("montreal")) return "montreal";
  if (
    t.includes("quebec city") ||
    t === "québec" ||
    t.includes("quebec") ||
    t.includes("ville de québec")
  ) {
    return "quebec";
  }
  return null;
}

export type CityAdminMetrics = {
  slug: CitySlug;
  /** Sum booking totals (confirmed + completed sample) */
  revenueCents: number;
  bookingCount: number;
  /** Nights in sample (rough occupancy proxy) */
  totalNights: number;
  investmentScore: number;
};

export type CityIntelligenceAdminSummary = {
  cities: CityAdminMetrics[];
  topCityByRevenue: CitySlug | null;
  topCityByVolume: CitySlug | null;
  topCityByBookingIntensity: CitySlug | null;
  topCityByInvestmentScore: CitySlug | null;
};

export async function getCityIntelligenceAdminSummary(): Promise<CityIntelligenceAdminSummary> {
  const bookings = await prisma.booking.findMany({
    where: {
      status: { in: ["CONFIRMED", "COMPLETED"] },
    },
    orderBy: { createdAt: "desc" },
    take: BOOKING_SAMPLE,
    select: {
      totalCents: true,
      nights: true,
      listing: { select: { city: true } },
    },
  });

  const bucket = new Map<CitySlug, { revenueCents: number; bookingCount: number; totalNights: number }>();
  for (const s of CITY_SLUGS) {
    bucket.set(s, { revenueCents: 0, bookingCount: 0, totalNights: 0 });
  }

  for (const b of bookings) {
    const slug = normalizeCityToSlug(b.listing.city);
    if (!slug) continue;
    const cur = bucket.get(slug)!;
    cur.revenueCents += b.totalCents;
    cur.bookingCount += 1;
    cur.totalNights += b.nights;
  }

  const insightRows = await Promise.all(CITY_SLUGS.map((slug) => getCityInsights(slug)));
  const scoreBySlug = new Map(insightRows.map((i) => [i.slug, i.investmentScore] as const));

  const cities: CityAdminMetrics[] = CITY_SLUGS.map((slug) => {
    const b = bucket.get(slug)!;
    return {
      slug,
      revenueCents: b.revenueCents,
      bookingCount: b.bookingCount,
      totalNights: b.totalNights,
      investmentScore: scoreBySlug.get(slug) ?? 0,
    };
  });

  let topCityByRevenue: CitySlug | null = null;
  let maxRev = -1;
  for (const c of cities) {
    if (c.revenueCents > maxRev) {
      maxRev = c.revenueCents;
      topCityByRevenue = c.slug;
    }
  }
  if (maxRev <= 0) topCityByRevenue = null;

  let topCityByVolume: CitySlug | null = null;
  let maxVol = -1;
  for (const c of cities) {
    if (c.bookingCount > maxVol) {
      maxVol = c.bookingCount;
      topCityByVolume = c.slug;
    }
  }
  if (maxVol <= 0) topCityByVolume = null;

  let topCityByBookingIntensity: CitySlug | null = null;
  let maxIntensity = -1;
  for (const c of cities) {
    if (c.bookingCount <= 0) continue;
    const intensity = c.totalNights / c.bookingCount;
    if (intensity > maxIntensity) {
      maxIntensity = intensity;
      topCityByBookingIntensity = c.slug;
    }
  }
  if (maxIntensity <= 0) topCityByBookingIntensity = null;

  let topCityByInvestmentScore: CitySlug | null = null;
  let maxScore = -1;
  for (const c of cities) {
    if (c.investmentScore > maxScore) {
      maxScore = c.investmentScore;
      topCityByInvestmentScore = c.slug;
    }
  }
  if (maxScore < 0) topCityByInvestmentScore = null;

  return {
    cities,
    topCityByRevenue,
    topCityByVolume,
    topCityByBookingIntensity,
    topCityByInvestmentScore,
  };
}
