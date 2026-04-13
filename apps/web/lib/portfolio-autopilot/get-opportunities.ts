import type { PortfolioListingSignals } from "./types";

export type PortfolioOpportunity = {
  listing: PortfolioListingSignals;
  kind: "traffic_not_converting" | "quality_low_exposure";
  note: string;
};

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export function getOpportunities(listings: PortfolioListingSignals[]): PortfolioOpportunity[] {
  if (listings.length === 0) return [];
  const views = listings.map((l) => l.views30d);
  const medViews = median(views);
  const medConv =
    median(
      listings.map((l) => (l.conversionRate != null ? l.conversionRate : 0))
    ) || 0.015;

  const out: PortfolioOpportunity[] = [];

  for (const l of listings) {
    const conv = l.conversionRate ?? 0;
    if (l.views30d >= medViews && medViews > 0 && conv < Math.max(0.008, medConv * 0.65)) {
      out.push({
        listing: l,
        kind: "traffic_not_converting",
        note: "Strong traffic vs portfolio median but conversion lags — tune copy, pricing, and trust.",
      });
    } else if (l.qualityScore >= 68 && l.views30d < medViews * 0.55 && medViews > 5) {
      out.push({
        listing: l,
        kind: "quality_low_exposure",
        note: "Quality is solid but visibility is below peers — promotions, photos, and calendar competitiveness.",
      });
    }
  }

  return out.slice(0, 8);
}
