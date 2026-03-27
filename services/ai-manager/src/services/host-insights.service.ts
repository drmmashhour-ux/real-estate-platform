import type { HostInsightsInput, HostInsightsOutput } from "../models/index.js";

/**
 * Generate host insights: occupancy trend, revenue trend, improvements, price tips.
 * In production this would aggregate from bookings/listings services; here we return
 * structure with placeholder/sample data when no external data is provided.
 */
export function getHostInsights(
  input: HostInsightsInput,
  options?: {
    occupancyData?: { date: string; occupancyPct: number }[];
    revenueData?: { date: string; revenueCents: number }[];
    listingQualityScore?: number;
    pricingSuggestion?: { recommendedNightlyCents: number };
  }
): HostInsightsOutput {
  const periodDays = input.periodDays ?? 30;
  const occupancyTrend =
    options?.occupancyData?.length ?? 0 > 0
      ? options!.occupancyData!
      : generatePlaceholderOccupancy(periodDays);
  const revenueTrend =
    options?.revenueData?.length ?? 0 > 0
      ? options!.revenueData!
      : generatePlaceholderRevenue(periodDays);

  const suggestedImprovements: string[] = [];
  if ((options?.listingQualityScore ?? 100) < 70) {
    suggestedImprovements.push("Improve listing description and add more photos to increase bookings.");
  }
  if ((options?.listingQualityScore ?? 100) < 85) {
    suggestedImprovements.push("Consider adding amenities (e.g. WiFi, kitchen) to improve ranking.");
  }
  suggestedImprovements.push("Keep your calendar updated to avoid double-bookings and improve search visibility.");
  suggestedImprovements.push("Respond to guest messages quickly to improve conversion and ratings.");

  const priceOptimizationTips: string[] = [];
  if (options?.pricingSuggestion) {
    priceOptimizationTips.push(
      `Recommended nightly price around $${(options.pricingSuggestion.recommendedNightlyCents / 100).toFixed(0)}. Adjust seasonally for peak demand.`
    );
  }
  priceOptimizationTips.push("Use dynamic pricing for weekends and holidays.");
  priceOptimizationTips.push("Review competitor prices in your area monthly.");

  return {
    occupancyTrend,
    revenueTrend,
    suggestedImprovements: suggestedImprovements.slice(0, 5),
    priceOptimizationTips,
    summary: `Insights for the last ${periodDays} days. ${suggestedImprovements.length} improvement(s) suggested. Use pricing tips to optimize revenue.`,
  };
}

function generatePlaceholderOccupancy(days: number): { date: string; occupancyPct: number }[] {
  const out: { date: string; occupancyPct: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push({
      date: d.toISOString().slice(0, 10),
      occupancyPct: 40 + Math.random() * 35,
    });
  }
  return out.slice(-14);
}

function generatePlaceholderRevenue(days: number): { date: string; revenueCents: number }[] {
  const out: { date: string; revenueCents: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push({
      date: d.toISOString().slice(0, 10),
      revenueCents: Math.round(8000 + Math.random() * 12000),
    });
  }
  return out.slice(-14);
}
