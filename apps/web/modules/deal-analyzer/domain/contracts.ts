export type ComparableSummaryDto = {
  comparablePropertyId: string;
  distanceKm: number | null;
  similarityScore: number;
  sourceType: string;
  priceCents: number;
  pricePerSqft: number | null;
  propertyType: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  areaSqft: number | null;
  listingStatus: string | null;
};

export type ComparablesBlockDto = {
  summary: {
    positioningOutcome: string | null;
    confidenceLevel: string | null;
    comparableCount: number | null;
    medianPriceCents: number | null;
    priceRangeCents: { low: number; high: number } | null;
    reasons: string[];
    warnings: string[];
  };
  items: ComparableSummaryDto[];
};

export type ScenarioSummaryDto = {
  scenarioType: string;
  scenarioMode: string | null;
  monthlyRent: number | null;
  occupancyRate: number | null;
  operatingCost: number | null;
  mortgageCost: number | null;
  monthlyCashFlow: number | null;
  annualRoiPercent: number | null;
  capRatePercent: number | null;
  warnings: string[];
  mortgageUnavailableReason: string | null;
  confidenceLevel: string | null;
  /** BNHub short-term rows — populated when scenarioMode is bnhub. */
  nightlyRateCents?: number | null;
  monthlyGrossRevenueCents?: number | null;
  monthlyNetOperatingCents?: number | null;
};

export type PortfolioRankingDto = {
  listingId: string;
  compositeScore: number;
  bucket: string;
  investmentScore: number;
  riskScore: number;
  reasons: string[];
};

export type BnhubDealSummaryDto = {
  recommendation: string;
  confidenceLevel: string;
  monthlyGrossRevenueCents: number | null;
  monthlyNetOperatingCents: number | null;
  nightlyRateCents: number | null;
  occupancyAssumed: number | null;
  platformFeePct: number;
  reasons: string[];
  warnings: string[];
};

export type DealDecisionDto = {
  recommendation: string;
  opportunity: string;
  reasons: string[];
  warnings: string[];
};

/** Safe JSON shape for API clients (no internal DB-only fields). */
export type DealAnalysisPublicDto = {
  investmentScore: number;
  riskScore: number;
  opportunityType: string;
  recommendation: string;
  confidenceLevel: string;
  reasons: string[];
  warnings: string[];
  riskLevel: "low" | "medium" | "high";
  scenarioPreview: {
    scenarioType: string;
    monthlyRent: number | null;
    occupancyRate: number | null;
    monthlyCashFlow: number | null;
    annualRoiPercent: number | null;
    capRatePercent: number | null;
    note: string | null;
  } | null;
  disclaimer: string;
  /** Phase 2 — present when flags enabled and data exists. */
  phase2?: {
    comparables?: ComparablesBlockDto | null;
    scenarios?: ScenarioSummaryDto[];
    decision?: DealDecisionDto | null;
    bnhub?: BnhubDealSummaryDto | null;
  };
};

export const DEAL_ANALYZER_DISCLAIMER =
  "This is a rules-based estimate using platform data only. It is not investment, legal, or tax advice. Verify with professionals before acting.";

/** Phase 3 — safe JSON for API clients (no internal-only fields). */
export type OfferConditionDto = {
  category: "financing" | "inspection" | "documents" | "timeline";
  label: string;
  note: string;
};

export type OfferStrategyPublicDto = {
  id: string;
  propertyId: string;
  analysisId: string | null;
  suggestedMinOfferCents: number | null;
  suggestedTargetOfferCents: number | null;
  suggestedMaxOfferCents: number | null;
  confidenceLevel: string;
  competitionSignal: string | null;
  riskLevel: string;
  offerBand: string;
  offerPosture: string;
  recommendedConditions: OfferConditionDto[];
  warnings: string[];
  explanation: string | null;
  updatedAt: string;
};

export type AffordabilityPublicDto = {
  id: string;
  propertyId: string;
  downPaymentCents: number | null;
  interestRate: number | null;
  amortizationYears: number | null;
  monthlyIncomeCents: number | null;
  monthlyDebtsCents: number | null;
  estimatedMonthlyPaymentCents: number | null;
  affordabilityLevel: string;
  affordabilityRatio: number | null;
  confidenceLevel: string;
  warnings: string[];
  explanation: string | null;
  updatedAt: string;
};

export type WatchlistPublicDto = {
  id: string;
  name: string;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
};

export type PortfolioAlertPublicDto = {
  id: string;
  watchlistId: string;
  propertyId: string;
  alertType: string;
  severity: string;
  title: string;
  message: string;
  status: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

export type SellerPricingAdvisorPublicDto = {
  propertyId: string;
  pricePosition: string;
  confidenceLevel: string;
  suggestedAction: string;
  reasons: string[];
  improvementActions: string[];
  explanation: string | null;
  updatedAt: string;
};

/** Phase 4 — refresh job / status. */
export type RefreshStatusPublicDto = {
  lastComparableRefreshAt: string | null;
  regionalProfileKey: string | null;
  lastKnownPriceCents: number | null;
  pendingJobs: { id: string; status: string; scheduledAt: string; triggerSource: string }[];
  evaluateReasons: string[];
};

export type NegotiationPlaybookPublicDto = {
  id: string;
  marketCondition: string;
  posture: string;
  confidenceLevel: string;
  playbookSteps: { step: string; rationale: string }[];
  warnings: string[];
  updatedAt: string;
};

export type RepricingReviewPublicDto = {
  propertyId: string;
  currentPriceCents: number;
  currentPosition: string;
  suggestedAction: string;
  confidenceLevel: string;
  reasons: string[];
  explanation: string | null;
  updatedAt: string;
};

export type PortfolioMonitoringSummaryDto = {
  watchlistId: string;
  evaluatedAt: string;
  upgradedCount: number;
  downgradedCount: number;
  trustDroppedCount: number;
  repricingRecommendedCount: number;
  biggestMovers: { propertyId: string; deltaScore: number }[];
  confidence: string;
  warnings: string[];
};

export type PortfolioMonitoringEventDto = {
  id: string;
  watchlistId: string;
  propertyId: string;
  eventType: string;
  severity: string;
  title: string;
  message: string;
  status: string;
  createdAt: string;
};
