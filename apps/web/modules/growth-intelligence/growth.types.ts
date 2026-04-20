/**
 * Growth Intelligence — domain types only (no business logic).
 * Phase 6 (timeline-aware): deterministic, explainable, auditable growth signals and opportunities.
 */

export type GrowthSignalType =
  | "seo_gap"
  | "content_gap"
  | "low_conversion_page"
  | "high_intent_search_opportunity"
  | "underexposed_listing_cluster"
  | "high_performing_region"
  | "demand_supply_imbalance"
  | "lead_form_dropoff"
  | "campaign_efficiency_shift"
  | "trust_conversion_opportunity"
  | "trend_reversal"
  | "stalled_funnel"
  | "repeat_dropoff_pattern";

export type GrowthOpportunityType =
  | "create_content_brief"
  | "create_programmatic_page_brief"
  | "improve_page_copy"
  | "improve_cta"
  | "promote_region"
  | "promote_listing_cluster"
  | "prioritize_broker_leads"
  | "recommend_trust_upgrade"
  | "recommend_seo_refresh"
  | "recommend_campaign_review"
  | "recommend_funnel_fix"
  | "recommend_reactivation_strategy";

export type GrowthSeverity = "info" | "warning" | "critical";

export type GrowthPriorityLevel = "low" | "medium" | "high" | "urgent";

/** Rolling windows for trend comparison labels (facts only — not statistical inference). */
export type GrowthTrendWindow = "1d" | "7d" | "30d" | "90d";

/** Optional cross-links to trust / legal / journey / append-only event facts. */
export type GrowthCrossReference = {
  kind: "trust" | "legal" | "journey" | "event";
  refKey: string;
  label?: string;
};

export type GrowthSignal = {
  id: string;
  signalType: GrowthSignalType;
  severity: GrowthSeverity;
  /** What entities or segments this signal refers to */
  entityType: string;
  entityId: string | null;
  region: string | null;
  locale: string;
  country: string;
  title: string;
  explanation: string;
  observedAt: string;
  metadata: Record<string, unknown>;
  references?: GrowthCrossReference[];
};

export type GrowthOpportunity = {
  id: string;
  opportunityType: GrowthOpportunityType;
  severity: GrowthSeverity;
  title: string;
  explanation: string;
  entityType: string;
  entityId: string | null;
  region: string | null;
  locale: string;
  country: string;
  /** Source signal ids driving this opportunity */
  signalIds: string[];
  createdAt: string;
  metadata: Record<string, unknown>;
  references?: GrowthCrossReference[];
};

export type GrowthPriorityScore = {
  opportunityId: string;
  totalScore: number;
  level: GrowthPriorityLevel;
  /** Deterministic breakdown — always present for audit */
  reasons: string[];
  components: {
    revenueRelevance: number;
    trafficConversionImpact: number;
    trustComplianceLeverage: number;
    regionalStrategicValue: number;
    easeOfExecution: number;
    repeatability: number;
    missedOpportunitySeverity: number;
    /** Timeline persistence / recurrence (0–100 scale) */
    timelinePersistence: number;
    /** Whether signals indicate deterioration vs prior window (0–100) */
    worseningIndicator: number;
    /** Trust/legal uplift available but under-leveraged (0–100) */
    trustLeverageUnused: number;
  };
};

export type GrowthInventoryByRegion = {
  regionKey: string;
  listingCount: number;
  activePublicCount: number;
};

export type GrowthLeadStats = {
  totalLeadsWindow: number;
  fsboLeadCount: number;
};

export type GrowthFunnelRatio = {
  listingId: string | null;
  views: number;
  contactClicks: number;
  ratio: number;
};

export type GrowthTrustBandStats = {
  band: "low" | "mid" | "high";
  count: number;
};

export type GrowthCampaignRollup = {
  sourceKey: string;
  views: number;
  contacts: number;
  efficiency: number;
};

/** Facts derived from append-only EventRecord timelines (when enabled). */
export type GrowthTimelineAggregation = {
  /** Event type → count in trailing 30d window */
  eventCounts30d: Partial<Record<string, number>>;
  /** Event type → count in previous 30d window (days 31–60 ago) */
  eventCountsPrev30d: Partial<Record<string, number>>;
  /** document entity id → rejection count in 30d */
  documentRejectCounts30d: Record<string, number>;
  /** workflow ids with submission/review activity but no approval in 30d (heuristic count) */
  stalledWorkflowCount: number;
  /** Whether timeline query succeeded */
  availabilityNotes: string[];
};

export type GrowthSnapshot = {
  id: string;
  collectedAt: string;
  locale: string;
  country: string;
  /** Which DB/analytics slices were successfully read */
  availabilityNotes: string[];
  inventoryByRegion: GrowthInventoryByRegion[];
  leadStats: GrowthLeadStats | null;
  funnelRatiosByListing: GrowthFunnelRatio[];
  trustDistribution: GrowthTrustBandStats[];
  legalReadinessSamples: Array<{ listingId: string; readinessHint: number | null }>;
  contentFreshness: {
    oldestSeoBlogDays: number | null;
    recentPostCount: number;
  } | null;
  campaignRollups: GrowthCampaignRollup[];
  rankingHints: Array<{ listingId: string; rankingScore: number | null }>;
  demandSignals: Array<{ regionKey: string; buyerIntentProxy: number; supplyCount: number }>;
  /** Append-only compliance timeline aggregates — absent when timeline engine off or empty */
  timelineAggregation?: GrowthTimelineAggregation | null;
};

export type GrowthExecutionResult = {
  ok: boolean;
  detail: string;
  recordedId: string | null;
  metadata: Record<string, unknown>;
};

export type GrowthDashboardSummary = {
  snapshotId: string;
  collectedAt: string;
  signalCountsByType: Partial<Record<GrowthSignalType, number>>;
  opportunityCountsByType: Partial<Record<GrowthOpportunityType, number>>;
  topOpportunityIds: string[];
  availabilityNotes: string[];
};

export type GrowthRegionOpportunitySummary = {
  regionKey: string;
  opportunityCount: number;
  highestSeverity: GrowthSeverity | null;
  summary: string;
};

export type GrowthFunnelSummary = {
  worstListings: Array<{ listingId: string; ratio: number; views: number; contacts: number }>;
  notes: string[];
};

export type GrowthTrustLeverageSummary = {
  highTrustLowExposureCount: number;
  notes: string[];
};

export type GrowthTrendSummary = {
  trendSignalCount: number;
  stalledFunnelHints: number;
  repeatDropoffHints: number;
  timelineWindowsCompared: GrowthTrendWindow[];
  notes: string[];
};
