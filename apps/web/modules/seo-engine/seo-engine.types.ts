/**
 * LECIPM SEO Engine — programmatic SEO helpers (deterministic; review before publish).
 */

export type SeoHub =
  | "marketplace"
  | "bnhub"
  | "investor"
  | "residence_services"
  | "editorial";

export type PropertyIntent =
  | "buy"
  | "rent"
  | "luxury"
  | "invest"
  | "short_term_stay"
  | "residence_services";

export type SeoKeywordPlan = {
  primaryKeyword: string;
  secondaryKeywords: string[];
  longTailVariants: string[];
  /** Editorial angle — factual, location-led */
  contentAngle: string;
};

export type SeoListingMetaInput = {
  title: string;
  city: string;
  province?: string;
  country?: string;
  /** e.g. condo, single-family — neutral label */
  propertyCategory?: string;
  priceLabel?: string;
  listingUrlPath?: string;
};

export type SeoCityPageInput = {
  city: string;
  province?: string;
  country?: string;
  /** rent | sale | luxury | stays | investor | residence-services */
  pageFocus: "rent" | "sale" | "luxury" | "stays" | "investor" | "residence_services";
};

export type SeoStayMetaInput = {
  title: string;
  city: string;
  neighborhood?: string;
  province?: string;
  /** Nightly rate label for display only — avoid guarantees */
  nightlyPriceLabel?: string;
  stayUrlPath?: string;
};

export type SeoResidenceMetaInput = {
  residenceName: string;
  city: string;
  province?: string;
  /** Coordination / services marketplace — never medical claims */
  residenceServicesUrlPath?: string;
};

export type SeoMetadataBundle = {
  title: string;
  metaDescription: string;
  canonicalPathSuggestion: string;
  ogTitle: string;
  ogDescription: string;
  /** Short snippet for structured data / JSON-LD hints (no inventory counts unless supplied) */
  structuredSnippet?: string;
};

export type SeoLandingPageKind =
  | "city_property_type"
  | "city_luxury"
  | "city_stays"
  | "city_investor"
  | "city_residence_services";

export type SeoLandingPageSuggestion = {
  kind: SeoLandingPageKind;
  routeSuggestion: string;
  title: string;
  h1: string;
  introParagraph: string;
  supportingSectionIdeas: string[];
  internalLinkTargets: string[];
};

export type SeoContentBrief = {
  topic: string;
  keywordTarget: string;
  introAngle: string;
  outline: string[];
  cta: string;
  linkedPages: { path: string; anchorSuggestion: string }[];
  reviewNote: string;
};

export type SeoInternalLinkEdge = {
  sourcePage: string;
  recommendedTargets: { path: string; anchorSuggestions: string[] }[];
};

export type SeoPerformanceSnapshot = {
  generatedAt: string;
  pagesGeneratedTotal: number;
  indexedTargetsEstimate: number;
  organicCtrPlaceholder: number | null;
  topLandingPagesPlaceholder: { path: string; sessionsEstimate: number }[];
  conversionsFromOrganicPlaceholder: number | null;
  notes: string[];
};

export type SeoQualityRules = {
  /** Short policy text surfaced in tooling */
  brandTone: string;
  disallowInventoryClaimsWithoutData: boolean;
  disallowInvestmentPromises: boolean;
  disallowMedicalOrCareClaimsForResidenceServices: boolean;
};
