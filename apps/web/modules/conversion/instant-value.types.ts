export type InstantValueIntent = "buy" | "rent" | "invest" | "host";

export type InstantValueInsight = {
  id: string;
  title: string;
  description: string;
  category: "opportunity" | "trust" | "pricing" | "demand";
  confidence?: "low" | "medium" | "high";
};

export type InstantValueSummary = {
  intent: InstantValueIntent;
  headline: string;
  subheadline: string;
  insights: InstantValueInsight[];
  ctaLabel: string;
  trustLines: string[];
};

export type InstantValuePageType = "home" | "leads" | "listings" | "property" | "broker_preview";

export type BuildInstantValueInput = {
  page: InstantValuePageType;
  intent?: InstantValueIntent;
  /** Listing / property context when available — never invent fields. */
  listing?: {
    priceCents?: number;
    city?: string;
    verified?: boolean;
    dealType?: "sale" | "rent";
    featured?: boolean;
    /** When known from analytics/service — optional */
    viewCount7d?: number;
  };
  /** Browse results context */
  listingsContext?: {
    resultCount?: number;
    dealType?: "sale" | "rent";
  };
  trustSignals?: {
    platformSecureCheckout?: boolean;
  };
};
