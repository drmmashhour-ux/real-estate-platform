/** AI Listing Assistant — assistive only; never auto-publishes or submits to Centris. */

export type ListingLanguage = "en" | "fr" | "ar";

export type ListingPropertyPartial = {
  title?: string;
  city?: string;
  region?: string;
  /** LecipmListingAssetType string, e.g. CONDO, HOUSE */
  listingType?: string;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  priceMajor?: number;
  yearBuilt?: number;
  /** Freeform notes the broker already has (Centris / internal) */
  existingDescription?: string;
  zoningNotes?: string;
};

export type GeneratedListingContent = {
  title: string;
  description: string;
  propertyHighlights: string[];
  amenities: string[];
  zoningNotes: string;
  disclaimers: string[];
  keySellingPoints: string[];
  targetBuyerProfile: string;
  centrisFormHints: {
    description: string;
    propertyHighlights: string;
    amenities: string;
    zoningNotes: string;
    disclaimers: string;
  };
  /** Language used for this draft */
  language: ListingLanguage;
};

export type ComplianceCheckResult = {
  compliant: boolean;
  warnings: string[];
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
};

export type PricingConfidenceLevel = "LOW" | "MEDIUM" | "HIGH";

export type PricingSuggestionResult = {
  suggestedMinMajor: number;
  suggestedMaxMajor: number;
  /** Transparency aliases — identical to band endpoints for UI clarity */
  priceBandLow: number;
  priceBandHigh: number;
  comparableCount: number;
  confidenceLevel: PricingConfidenceLevel;
  thinDataWarning: boolean;
  competitivenessScore: number;
  rationale: string;
};

export type ListingReadinessStatus = "READY" | "NEEDS_EDITS" | "HIGH_RISK";

export type ListingReadinessResult = {
  readinessStatus: ListingReadinessStatus;
  readinessScore: number;
  topBlockers: string[];
  recommendedFixes: string[];
};

/** SEO pack — deterministic hints; brokers validate. */
export type SeoPack = {
  keywords: string[];
  metaDescription: string;
  googleTitle: string;
};

/** Centris paste schema — JSON or copy-ready text only. */
export type CentrisStructuredExport = {
  title: string;
  description: string;
  features: string[];
  amenities: string[];
  zoning: string;
  disclaimers: string;
};

export type BuyerTargeting = {
  targetBuyer: string;
  strategy: string;
};

export type ListingPerformanceScore = {
  listingScore: number;
  improvementSuggestions: string[];
};

export type ListingAssistantUiAlert = {
  id: string;
  severity: "info" | "warning" | "critical";
  title: string;
  detail: string;
};

export type FullListingAssistantBundle = {
  content: GeneratedListingContent;
  compliance: ComplianceCheckResult;
  seo: SeoPack;
  buyerTargeting: BuyerTargeting;
  listingPerformance: ListingPerformanceScore;
  centrisStructured: CentrisStructuredExport;
  language: ListingLanguage;
  /** Populated when `/api/listing/assistant/generate` attaches readiness heuristics. */
  readiness?: ListingReadinessResult;
  /** Operational nudges (assistive-only — broker still validates). */
  alerts?: ListingAssistantUiAlert[];
};
