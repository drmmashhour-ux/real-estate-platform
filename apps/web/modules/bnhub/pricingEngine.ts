export type ListingData = {
  id: string;
  /** Canonical nightly baseline */
  baseNightly?: number;
  /** Legacy prop used by demos */
  basePrice?: number;
  city?: string;
  /** Legacy demo prop */
  location?: string;
  bedrooms?: number;
  occupancyHint?: number;
  /** Legacy demo prop */
  occupancyRate?: number;
  peerAvg?: number;
  /** Legacy demo prop */
  similarListingsAvgPrice?: number;
};

export type PricingSuggestion = {
  suggestedPrice: number;
  changePercent: number;
  confidenceLevel: "low" | "medium" | "high";
  reason: string;
};

function seasonalityFactor(d: Date): number {
  const m = d.getMonth();
  if (m >= 5 && m <= 8) return 1.06;
  if (m === 11 || m === 0) return 1.04;
  return 0.98;
}

export function getSuggestedPrice(listing: ListingData, asOf: Date): PricingSuggestion {
  const basePrimary = listing.baseNightly ?? listing.basePrice;
  const anchor = listing.peerAvg ?? listing.similarListingsAvgPrice ?? basePrimary ?? 150;
  const base = typeof basePrimary === "number" ? basePrimary : anchor;
  const occ = listing.occupancyHint ?? listing.occupancyRate ?? 0.72;
  const beds = listing.bedrooms ?? 2;
  const city = listing.city ?? listing.location ?? "";
  const bedBoost = Math.min(0.12, beds * 0.02);
  const seasonal = seasonalityFactor(asOf);
  const raw = base * seasonal * (1 + bedBoost) + (occ - 0.65) * 18;
  const suggestedPrice = Math.max(49, Math.round(raw));

  const changePercent =
    base <= 0
      ? 0
      : Math.round(((suggestedPrice - base) / base) * 1000) / 10;

  let confidenceLevel: PricingSuggestion["confidenceLevel"] = "medium";
  if (Math.abs(changePercent) < 3) confidenceLevel = "high";
  if (Math.abs(changePercent) > 12) confidenceLevel = "low";

  return {
    suggestedPrice,
    changePercent,
    confidenceLevel,
    reason:
      occupancyHintAdjusted(occ) +
      `${city.length ? ` ${city} demand pattern applied (demo).` : ""}`,
  };
}

function occupancyHintAdjusted(occ: number): string {
  if (occ >= 0.78) return "Strong occupancy cushion — modest nightly lift protects margin.";
  if (occ < 0.6) return "Soft occupancy signals — prioritize calendar health before raises.";
  return "Stable occupancy baseline — tweak supply mix before altering headline rate.";
}
