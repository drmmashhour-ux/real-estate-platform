import { prisma } from "@/lib/db";

export type PriceSuggestionResult = {
  proposedNightPriceCents: number;
  reason: string;
  confidenceScore: number;
};

/** Suggestion-only (high risk) — grounded in peers + latest pricing snapshot when available. */
export async function generatePriceSuggestion(listingId: string): Promise<PriceSuggestionResult> {
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: { nightPriceCents: true, city: true },
  });
  if (!listing) {
    return { proposedNightPriceCents: 0, reason: "Listing not found.", confidenceScore: 0 };
  }

  const snap = await prisma.listingPricingSnapshot.findFirst({
    where: { listingId },
    orderBy: { capturedAt: "desc" },
    select: { suggestedPrice: true, appliedPrice: true, basePrice: true },
  });

  const peers = await prisma.shortTermListing.findMany({
    where: { city: listing.city, id: { not: listingId } },
    select: { nightPriceCents: true },
    take: 50,
  });
  const prices = peers.map((p) => p.nightPriceCents).filter((n) => n > 0).sort((a, b) => a - b);
  const med = prices.length ? prices[Math.floor(prices.length / 2)]! : listing.nightPriceCents;

  let target = listing.nightPriceCents;
  if (snap?.suggestedPrice != null && snap.suggestedPrice > 0) {
    target = Math.round(snap.suggestedPrice * 100);
  } else {
    const ratio = listing.nightPriceCents / Math.max(1, med);
    if (ratio > 1.25) target = Math.round(med * 1.08);
    else if (ratio < 0.75) target = Math.round(med * 0.95);
    else target = listing.nightPriceCents;
  }

  const reason =
    snap?.suggestedPrice != null
      ? "Aligned toward latest pricing intelligence snapshot (suggested nightly rate)."
      : "Adjusted toward median of similar published stays in the same city (rule-based; verify before changing price).";

  return {
    proposedNightPriceCents: Math.max(100, target),
    reason,
    confidenceScore: snap ? 62 : 52,
  };
}
