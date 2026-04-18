import { PricingRecommendation } from "./marketplace-intelligence.types";

export function recommendListingPrice(input: {
  listing: any;
  marketMedian?: number | null;
  occupancyRate?: number | null;
  conversionRate?: number | null;
  views?: number | null;
  bookings?: number | null;
}): PricingRecommendation | null {
  const currentPrice = Number(input.listing?.pricePerNight ?? 0);
  if (!currentPrice || currentPrice <= 0) return null;

  let adjustment = 0;
  const evidence: Record<string, unknown> = {
    marketMedian: input.marketMedian ?? null,
    occupancyRate: input.occupancyRate ?? null,
    conversionRate: input.conversionRate ?? null,
    views: input.views ?? null,
    bookings: input.bookings ?? null,
  };

  let reason = "No pricing adjustment recommended.";
  let confidence = 0.45;

  if (input.views && input.views > 100 && (!input.bookings || input.bookings === 0)) {
    adjustment = -0.1;
    confidence = 0.75;
    reason = "Strong listing interest with weak booking conversion suggests price may be too high.";
  } else if ((input.bookings ?? 0) >= 5 && (input.occupancyRate ?? 0) >= 0.7) {
    adjustment = 0.08;
    confidence = 0.72;
    reason = "Healthy booking demand suggests modest upward pricing room.";
  } else if (input.marketMedian && currentPrice < input.marketMedian * 0.75) {
    adjustment = 0.05;
    confidence = 0.65;
    reason = "Current price appears materially below local market median.";
  }

  const maxIncrease = 0.15;
  const maxDecrease = -0.15;
  adjustment = Math.max(maxDecrease, Math.min(maxIncrease, adjustment));

  return {
    listingId: input.listing.id,
    currentPrice,
    recommendedPrice: Number((currentPrice * (1 + adjustment)).toFixed(2)),
    adjustmentPercent: adjustment,
    confidence,
    reason,
    evidence,
    createdAt: new Date().toISOString(),
  };
}
