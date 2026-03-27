/**
 * Derive explainable preference hints from recent listing views (rule-based).
 */

import { prisma } from "@/lib/db";

const WINDOW_DAYS = 45;

export type UserPreferenceHints = {
  suggestedLocations: string[];
  suggestedPriceRangeCents: { min: number; max: number } | null;
  explanation: string;
};

export async function getUserPreferenceHints(userId: string): Promise<UserPreferenceHints> {
  const since = new Date();
  since.setDate(since.getDate() - WINDOW_DAYS);

  const views = await prisma.aiUserActivityLog.findMany({
    where: { userId, eventType: "listing_view", createdAt: { gte: since } },
    select: { listingId: true },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  const ids = [...new Set(views.map((v) => v.listingId).filter(Boolean) as string[])];
  if (ids.length === 0) {
    return {
      suggestedLocations: [],
      suggestedPriceRangeCents: null,
      explanation: "Browse a few listings to unlock location and price hints.",
    };
  }

  const meta = await prisma.shortTermListing.findMany({
    where: { id: { in: ids.slice(0, 20) } },
    select: { city: true, nightPriceCents: true },
  });

  const cities = [...new Set(meta.map((m) => m.city).filter(Boolean))];
  const prices = meta.map((m) => m.nightPriceCents).filter((n) => n > 0);
  let range: { min: number; max: number } | null = null;
  if (prices.length > 0) {
    const lo = Math.min(...prices);
    const hi = Math.max(...prices);
    const pad = Math.max(10_000, Math.floor((hi - lo) * 0.15));
    range = {
      min: Math.max(0, lo - pad),
      max: hi + pad,
    };
  }

  const explanation = [
    `Inferred from ${ids.length} recent view${ids.length === 1 ? "" : "s"} in the last ${WINDOW_DAYS} days.`,
    cities.length ? `Cities: ${cities.slice(0, 5).join(", ")}.` : "",
    range ? `Typical nightly range you viewed: $${(range.min / 100).toFixed(0)}–$${(range.max / 100).toFixed(0)} (±padding).` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return {
    suggestedLocations: cities.slice(0, 8),
    suggestedPriceRangeCents: range,
    explanation,
  };
}
