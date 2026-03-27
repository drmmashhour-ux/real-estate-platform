/**
 * Broker pricing assistant — comparable stats from DB (explainable heuristics).
 */

import { prisma } from "@/lib/db";

export type PricingSuggestion = {
  listingId: string;
  subjectNightPriceCents: number;
  sampleSize: number;
  medianNightPriceCents: number | null;
  p25Cents: number | null;
  p75Cents: number | null;
  recommendedMinCents: number;
  recommendedMaxCents: number;
  explanation: string;
};

function percentile(sorted: number[], p: number): number | null {
  if (!sorted.length) return null;
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx] ?? null;
}

export async function suggestNightlyPriceForListing(listingId: string): Promise<PricingSuggestion | null> {
  const subject = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: { id: true, nightPriceCents: true, city: true, beds: true },
  });
  if (!subject) return null;

  const peers = await prisma.shortTermListing.findMany({
    where: {
      city: subject.city,
      beds: subject.beds,
      listingStatus: "PUBLISHED",
      NOT: { id: listingId },
    },
    select: { nightPriceCents: true },
    take: 80,
  });

  const prices = peers.map((p) => p.nightPriceCents).sort((a, b) => a - b);
  const median = percentile(prices, 50);
  const p25 = percentile(prices, 25);
  const p75 = percentile(prices, 75);

  const base = median ?? subject.nightPriceCents;
  const spread = median ? Math.max(5000, Math.round((p75! - p25!) / 2 || base * 0.1)) : Math.round(base * 0.12);

  const recommendedMinCents = Math.max(1000, base - spread);
  const recommendedMaxCents = base + spread;

  const explanation = [
    `Compared ${prices.length} published listings in ${subject.city} with ${subject.beds} beds.`,
    median
      ? `Median nightly rate ≈ ${(median / 100).toFixed(0)} (local peers).`
      : "Insufficient peers — widen city/bed criteria or add comps manually.",
    "Adjust for seasonality, amenities, and regulations before publishing.",
  ].join(" ");

  return {
    listingId: subject.id,
    subjectNightPriceCents: subject.nightPriceCents,
    sampleSize: prices.length,
    medianNightPriceCents: median,
    p25Cents: p25,
    p75Cents: p75,
    recommendedMinCents,
    recommendedMaxCents,
    explanation,
  };
}
