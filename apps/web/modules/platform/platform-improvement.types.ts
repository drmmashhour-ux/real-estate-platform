/**
 * Platform improvement pass — advisory types only.
 */

export type PlatformClaritySurfaceId =
  | "homepage"
  | "get_leads"
  | "listings"
  | "property_detail"
  | "bnhub_entry"
  | "broker_preview";

export type PlatformClaritySurfaceReview = {
  surfaceId: PlatformClaritySurfaceId;
  primaryPurpose: string;
  primaryCta: string;
  audience: string;
  frictionRisks: string[];
  suggestedImprovements: string[];
};

export type PlatformClarityReviewResult = {
  surfaces: PlatformClaritySurfaceReview[];
  notes: string[];
};

export type MonetizationBucket = "free_teaser" | "paid_unlock" | "subscription" | "commission" | "boost_upgrade";

export type MonetizedSurface = {
  label: string;
  bucket: MonetizationBucket;
  notes: string;
};

export type PlatformMonetizationReviewResult = {
  monetizedSurfaces: MonetizedSurface[];
  unmonetizedValueLeakage: string[];
  highPriorityMonetizationGaps: string[];
  notes: string[];
};

export type PlatformTrustPatternId =
  | "verified_listing"
  | "verified_host_broker"
  | "updated_recently"
  | "secure_payment"
  | "no_hidden_fees"
  | "real_opportunities";

export type PlatformTrustCoverageGap = {
  patternId: PlatformTrustPatternId;
  gap: string;
};

export type PlatformTrustReviewResult = {
  supportedPatterns: PlatformTrustPatternId[];
  coverageGaps: PlatformTrustCoverageGap[];
  standardizationNotes: string[];
};

export type PlatformOpsCommandSurfaceId =
  | "growth_machine_dashboard"
  | "bnhub_host_admin"
  | "broker_acquisition"
  | "revenue_dashboard"
  | "mission_control";

export type PlatformOpsReviewResult = {
  duplicatePanels: string[];
  missingShortcuts: string[];
  overloadedPages: string[];
  consolidationSuggestions: string[];
  surfaces: { surfaceId: PlatformOpsCommandSurfaceId; note: string }[];
};

export type PlatformDataMoatReviewResult = {
  capturedSignals: string[];
  missingHighValueSignals: string[];
  strongestMoatCandidates: string[];
  notes: string[];
};

export type PlatformImprovementPriorityCategory =
  | "revenue"
  | "conversion"
  | "trust"
  | "ops"
  | "data";

export type PlatformImprovementUrgency = "low" | "medium" | "high";

export type PlatformImprovementPriority = {
  title: string;
  why: string;
  expectedImpact: string;
  category: PlatformImprovementPriorityCategory;
  urgency: PlatformImprovementUrgency;
};

export type PlatformImprovementBundle = {
  clarity: PlatformClarityReviewResult;
  monetization: PlatformMonetizationReviewResult;
  trust: PlatformTrustReviewResult;
  ops: PlatformOpsReviewResult;
  dataMoat: PlatformDataMoatReviewResult;
  priorities: PlatformImprovementPriority[];
  createdAt: string;
};
