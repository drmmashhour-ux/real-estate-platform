/**
 * AI Growth Brain — core types (analysis + recommendations; human approval for high-impact actions).
 */

export type GrowthBrainDomain =
  | "supply"
  | "demand"
  | "seo"
  | "content"
  | "conversion"
  | "revenue"
  | "retention";

export type GrowthBrainPriorityLevel = "low" | "medium" | "high";

/** Matches persisted Prisma model + API payloads. */
export type GrowthActionRecommendation = {
  id: string;
  type: string;
  domain: GrowthBrainDomain;
  priority: GrowthBrainPriorityLevel;
  /** 0–1 calibrated score */
  confidence: number;
  title: string;
  description: string;
  reasoning: string;
  suggestedAction: string;
  autoRunnable: boolean;
  requiresApproval: boolean;
  targetEntityType: string | null;
  targetEntityId: string | null;
  metadataJson: Record<string, unknown> | null;
  createdAt: Date;
  fingerprint?: string;
  runId?: string;
  status?: string;
};

export type GrowthAutomationMode = "OFF" | "ASSIST" | "SAFE_AUTOPILOT" | "FULL_WITH_APPROVAL";

export type InventoryRow = {
  city: string;
  category: string | null;
  fsboCount: number;
  bnhubCount: number;
  totalListings: number;
};

export type DemandRow = {
  city: string;
  category: string | null;
  impressionCount: number;
  engagementWeighted: number;
  trendScore: number;
};

export type ListingPerformanceRow = {
  kind: "FSBO" | "CRM" | "BNHUB";
  listingId: string;
  city: string | null;
  viewsTotal: number;
  contactClicks: number;
  saves: number;
  unlockStarts: number;
  unlockSuccesses: number;
  bookings: number;
  demandScore: number;
};

export type GrowthLeadSummary = {
  id: string;
  role: string;
  city: string | null;
  category: string | null;
  stage: string;
  source: string;
  permissionStatus: string;
  needsFollowUp: boolean;
  updatedAt: Date;
  listingAcquisitionLeadId: string | null;
};

export type BuyerSessionSummary = {
  sessionId: string;
  userId: string | null;
  listingViews: number;
  uniqueListings: number;
  saves: number;
  contactClicks: number;
  unlockStarts: number;
  unlockSuccesses: number;
  bookingAttempts: number;
  mapClicks: number;
  filterEvents: number;
  positiveDwell: number;
  cities: string[];
};

export type GrowthBrainSnapshot = {
  generatedAt: Date;
  sparse: boolean;
  inventoryByCityCategory: InventoryRow[];
  demandByCityCategory: DemandRow[];
  topConvertingListings: ListingPerformanceRow[];
  lowPerformingListings: ListingPerformanceRow[];
  staleGrowthLeads: GrowthLeadSummary[];
  hotGrowthLeads: GrowthLeadSummary[];
  highIntentBuyers: BuyerSessionSummary[];
  risingSegments: DemandRow[];
  seoCoverageGaps: { city: string; kind: "fsbo" | "bnhub" | "both"; listingCount: number }[];
  monetizationSignals: {
    avgUnlockStartToSuccessRatio: number | null;
    segmentsWithStrongUnlock: string[];
    brokerHeavyCities: { city: string; brokerLeadHint: number }[];
  };
  globalHints: {
    totalActiveGrowthLeads: number;
    totalBehaviorEvents7d: number;
    totalListingAnalyticsRows: number;
  };
};

export type ScoredGrowthLead = {
  leadId: string;
  score: number;
  tier: "cold" | "warm" | "hot";
  reasons: string[];
  recommendedNextAction: string;
};

export type ScoredBuyerIntent = {
  sessionKey: string;
  userId: string | null;
  score: number;
  tier: "browse" | "engaged" | "high_intent" | "ready";
  reasons: string[];
  recommendedNextAction: string;
};

export type ContentRec = {
  title: string;
  subtitle: string;
  cta: string;
  targetUrl: string;
  reason: string;
};

export type SeoOpportunity = {
  slugSuggestion: string;
  title: string;
  reason: string;
  priority: GrowthBrainPriorityLevel;
};
