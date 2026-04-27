import type { CityPricingRecommendation } from "@/lib/market/cityPricingEngine";
import type { ListingPricingRecommendation } from "@/lib/market/listingPricingEngine";

/**
 * Simple narrative strings for the investor demo (not the full structured market-insights service).
 */
export function generateMarketInsights(
  cityPricing: CityPricingRecommendation[],
  listingPricing: ListingPricingRecommendation[]
): { insights: string[]; actions: string[] } {
  const insights: string[] = [];
  const actions: string[] = [];

  const highDemandCities = cityPricing.filter(
    (c) => c.demandScore >= 50 || c.recommendation === "increase_price"
  );
  if (highDemandCities.length > 0) {
    const c = highDemandCities[0]!;
    insights.push(
      highDemandCities.length > 1
        ? "Several markets show strong demand on city-level heatmap."
        : `${c.city} demand is strong — lead markets for upward pricing tests.`
    );
  }

  if (highDemandCities.some((x) => x.city.toLowerCase().includes("montreal"))) {
    if (!insights.some((i) => i.toLowerCase().includes("montreal")))
      insights.push("Montreal demand signals are in focus for the current window.");
  }

  const highConv = listingPricing.filter((l) => l.conversionRate >= 0.06);
  if (highConv.length >= 3) {
    insights.push("Strong conversion across multiple listings — guests are booking at healthy rates.");
  } else if (highConv.length >= 1) {
    insights.push("Top listings show conversion efficiency worth scaling to peer inventory.");
  }

  const lowConvCluster = listingPricing.filter(
    (l) => l.views > 20 && l.conversionRate < 0.02
  );
  if (lowConvCluster.length >= 3) {
    insights.push("Pricing inefficiencies detected: traffic without proportional bookings in a cluster of stays.");
  }

  if (cityPricing.some((c) => c.recommendation === "decrease_price")) {
    actions.push("Review underperforming cities for promotional nightly rates and calendar gaps.");
  }
  if (cityPricing.some((c) => c.recommendation === "increase_price")) {
    actions.push("Test bounded price increases in high-demand cities (recommendation-only until host approval).");
  }
  if (listingPricing.some((l) => l.recommendation === "decrease_price")) {
    actions.push("Tighten photos and value props for listings with high views and low conversion.");
  }

  if (insights.length === 0 && cityPricing.length + listingPricing.length > 0) {
    insights.push("Demand and listing signals are in a stable band — good period to A/B test price positioning.");
  }
  if (actions.length === 0 && (cityPricing.length > 0 || listingPricing.length > 0)) {
    actions.push("Continue monitoring week-over-week; hold changes until signal strengthens.");
  }

  return { insights, actions };
}
