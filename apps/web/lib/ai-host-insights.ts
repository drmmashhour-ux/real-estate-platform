/**
 * Host insights from DB: occupancy trend, revenue trend, suggested improvements, price tips.
 * Used when AI_MANAGER_URL is not set.
 */
import { prisma } from "@/lib/db";
import { getAiPricingRecommendation } from "@/lib/ai-pricing";
import { getHostListingRecommendations } from "@/lib/ai-host-optimization";

export async function getHostInsightsFromDb(
  hostId: string,
  options?: { listingIds?: string[]; periodDays?: number }
): Promise<{
  occupancyTrend: { date: string; occupancyPct: number }[];
  revenueTrend: { date: string; revenueCents: number }[];
  suggestedImprovements: string[];
  priceOptimizationTips: string[];
  summary: string;
}> {
  const periodDays = options?.periodDays ?? 30;
  const start = new Date();
  start.setDate(start.getDate() - periodDays);

  const listings = await prisma.shortTermListing.findMany({
    where: { ownerId: hostId, ...(options?.listingIds?.length ? { id: { in: options.listingIds } } : {}) },
    select: { id: true },
  });
  const listingIds = listings.map((l) => l.id);

  const bookings = await prisma.booking.findMany({
    where: {
      listingId: { in: listingIds },
      checkIn: { gte: start },
      status: { in: ["CONFIRMED", "COMPLETED"] },
    },
    select: {
      checkIn: true,
      checkOut: true,
      totalCents: true,
      nights: true,
      listingId: true,
    },
  });

  const daysInPeriod = periodDays;
  const occupancyByDate: Record<string, number> = {};
  const revenueByDate: Record<string, number> = {};
  for (let i = 0; i < daysInPeriod; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    occupancyByDate[key] = 0;
    revenueByDate[key] = 0;
  }

  const totalNightsAvailable = listingIds.length * daysInPeriod || 1;
  let totalNightsBooked = 0;
  for (const b of bookings) {
    const checkIn = new Date(b.checkIn);
    const checkOut = new Date(b.checkOut);
    for (let d = new Date(checkIn); d < checkOut; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().slice(0, 10);
      if (occupancyByDate[key] !== undefined) {
        occupancyByDate[key]++;
        totalNightsBooked++;
      }
    }
    const nightCents = Math.round(b.totalCents / b.nights);
    for (let d = new Date(checkIn); d < checkOut; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().slice(0, 10);
      if (revenueByDate[key] !== undefined) revenueByDate[key] += nightCents;
    }
  }

  const occupancyTrend = Object.entries(occupancyByDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([date, nights]) => ({
      date,
      occupancyPct: Math.round((nights / Math.max(1, listingIds.length)) * 100),
    }));

  const revenueTrend = Object.entries(revenueByDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([date, revenueCents]) => ({ date, revenueCents }));

  const suggestedImprovements: string[] = [];
  if (listingIds.length > 0) {
    const recs = await getHostListingRecommendations(listingIds[0]);
    suggestedImprovements.push(...recs.map((r) => `${r.title}: ${r.description}`));
  }
  if (suggestedImprovements.length === 0) {
    suggestedImprovements.push("Keep your calendar updated.");
    suggestedImprovements.push("Respond to guest messages quickly.");
  }

  const priceOptimizationTips: string[] = [];
  if (listingIds.length > 0) {
    try {
      const pricing = await getAiPricingRecommendation(listingIds[0], { store: false });
      priceOptimizationTips.push(
        `Recommended around $${(pricing.recommendedCents / 100).toFixed(0)}/night. Demand: ${pricing.demandLevel}.`
      );
    } catch {
      // ignore
    }
  }
  priceOptimizationTips.push("Use dynamic pricing for weekends and holidays.");
  priceOptimizationTips.push("Review competitor prices in your area monthly.");

  const avgOccupancy =
    occupancyTrend.length > 0
      ? Math.round(
          occupancyTrend.reduce((s, t) => s + t.occupancyPct, 0) / occupancyTrend.length
        )
      : 0;
  const summary = `Last ${periodDays} days: avg occupancy ~${avgOccupancy}%. ${suggestedImprovements.length} improvement(s) suggested.`;

  return {
    occupancyTrend,
    revenueTrend,
    suggestedImprovements: suggestedImprovements.slice(0, 5),
    priceOptimizationTips,
    summary,
  };
}
