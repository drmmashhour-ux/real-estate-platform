import type { RecommendationStrategy } from "./recommendation.types";

export function defaultSubtitle(strategy: RecommendationStrategy, city?: string | null): string | undefined {
  switch (strategy) {
    case "similar_listings":
      return city ? `Based on price range and property type in ${city}` : "Based on price range and property type";
    case "because_you_viewed":
      return "Informed by your recent views in this session";
    case "because_you_saved":
      return "Related to listings you saved";
    case "trending_now":
      return "Internal quality and engagement signals";
    case "price_drop_opportunities":
      return "Recent seller-side updates (verify price on listing)";
    case "high_value_deals":
      return "Strong price position vs peer set where data is available";
    case "high_demand_stays":
      return "Short-term stays with solid booking signals";
    case "investor_opportunities":
      return "Filters favor rent-ready or value-add signals";
    case "host_improvement_opportunities":
      return "Actionable completeness gaps for hosts";
    default:
      return undefined;
  }
}
