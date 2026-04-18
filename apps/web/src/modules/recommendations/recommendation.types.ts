export type RecommendationStrategy =
  | "similar_listings"
  | "because_you_viewed"
  | "because_you_saved"
  | "trending_now"
  | "price_drop_opportunities"
  | "high_value_deals"
  | "high_demand_stays"
  | "investor_opportunities"
  | "host_improvement_opportunities";

export type RecommendationItem = {
  id: string;
  kind: "fsbo" | "bnhub";
  title: string;
  priceLabel: string;
  city: string;
  coverImage: string | null;
  href: string;
};

export type RecommendationBlock = {
  strategy: RecommendationStrategy;
  title: string;
  subtitle?: string;
  explanation?: string;
  items: RecommendationItem[];
  generatedAt: string;
};

export type RecommendationContext = {
  sessionId?: string | null;
  userId?: string | null;
  city?: string | null;
  excludeIds?: string[];
  limit?: number;
  /** Logged-in but few session signals — broaden similar-listing matching. */
  sparseSession?: boolean;
};
