/** Unified admin marketplace dashboard — investor-grade summaries (read-only). */

export type DashboardHealthLevel = "healthy" | "degraded" | "critical" | "unknown";

/** Syria slice — populated when `FEATURE_SYRIA_REGION_ADAPTER_V1` is enabled and reads succeed. */
export type SyriaMarketplaceKpiSlice = {
  totalListings: number;
  pendingReviewListings: number;
  featuredListings: number;
  fraudFlaggedListings: number;
  stalePublishedListings: number;
  totalBookings: number;
  bnhubStaysListings: number;
  bookingGrossHint: number | null;
  payoutsPending: number;
  payoutsApproved: number;
  payoutsPaid: number;
  listingPaymentsVerifiedHint: number;
  availability: "available" | "unavailable";
  notes?: string[];
};

export type SyriaMarketplaceRiskSlice = {
  fraudFlaggedListings: number;
  elevatedFraudHint: boolean;
  reviewBacklogHint: boolean;
  payoutStressHint: boolean;
  normalizedRiskTags: readonly string[];
  notes?: string[];
};

export type SyriaMarketplaceGrowthSlice = {
  bookingVolumeHint: number | null;
  bnhubStaysListings: number;
  payoutPipelinePending: number;
  cancelledBookings: number;
  notes?: string[];
};

export type RegionComparisonRow = {
  regionCode: string;
  label: string;
  totalListings: number;
  pendingReview: number;
  featuredListings: number;
  fraudFlaggedListings: number;
  bookings: number;
  notes?: string[];
};

export type MarketplaceKpiSummary = {
  activeListingHint?: number | null;
  blockedActionHint?: number | null;
  automationDryRunRatioHint?: number | null;
  notes?: string[];
  /** Syria regional metrics (read-only adapter). */
  syria?: SyriaMarketplaceKpiSlice | null;
};

export type MarketplaceRiskSummary = {
  elevatedLegalRiskHint?: boolean;
  complianceHoldHint?: boolean;
  notes?: string[];
  syria?: SyriaMarketplaceRiskSlice | null;
};

export type MarketplaceTrustSummary = {
  trustFloorActiveHint?: boolean;
  notes?: string[];
};

export type MarketplaceGrowthSummary = {
  growthMachineEnabled: boolean;
  notes?: string[];
  syria?: SyriaMarketplaceGrowthSlice | null;
};

export type MarketplaceLegalSummary = {
  legalIntelRouteAvailable: boolean;
  notes?: string[];
};

export type MarketplaceAutomationSummary = {
  autonomousMarketplaceEnabled: boolean;
  controlledExecutionEnabled: boolean;
  approvalsEnabled: boolean;
};

export type MarketplaceRankingSummary = {
  rankingFlagEnabled: boolean;
  notes?: string[];
};

/** Aggregate Syria signal-class proxies from regional SQL — not a sum of per-listing preview signals. */
export type SyriaSignalDashboardRollup = {
  signalsBySeverity: { info: number; warning: number; critical: number };
  /** Fraud-flagged Syria properties (critical-class proxy). */
  fraudSignalListingCount: number;
  /** Published properties past stale threshold (info-class proxy). */
  staleListingCount: number;
  /** Fraud plus pending-review listings needing elevated attention (high-attention proxy). */
  highRiskListingCount: number;
  notes?: readonly string[];
};

export type MarketplaceDashboardSummary = {
  health: DashboardHealthLevel;
  kpis: MarketplaceKpiSummary;
  risk: MarketplaceRiskSummary;
  trust: MarketplaceTrustSummary;
  growth: MarketplaceGrowthSummary;
  legal: MarketplaceLegalSummary;
  automation: MarketplaceAutomationSummary;
  ranking: MarketplaceRankingSummary;
  /** Side-by-side region rows (Syria vs web CRM counts) — advisory only. */
  regionComparison?: RegionComparisonRow[];
  /** Deterministic Syria capability envelope (preview-only phase). */
  syriaCapabilityNotes?: readonly string[];
  syriaPreviewAvailable?: boolean;
  executionUnavailableForSyria?: true;
  syriaSignalRollup?: SyriaSignalDashboardRollup | null;
};
