/**
 * Darlink marketplace autonomy — pure types (no logic).
 * Safety-bounded: policy + governance + gates; no black-box decisions.
 */

export type MarketplaceEntityType = "listing" | "booking" | "payout" | "user" | "lead";

export type MarketplaceSignalType =
  | "low_conversion"
  | "high_interest"
  | "stale_listing"
  | "pricing_pressure"
  | "trust_risk"
  | "fraud_risk"
  | "review_backlog"
  | "booking_dropoff"
  | "payout_stress"
  | "content_quality_issue"
  | "engagement_spike"
  | "inactive_inventory";

export type MarketplaceOpportunityType =
  | "review_pricing"
  | "improve_listing_content"
  | "request_admin_review"
  | "increase_visibility"
  | "reduce_risk"
  | "review_booking_friction"
  | "review_payout_state"
  | "promote_high_trust_listing"
  | "refresh_stale_listing"
  | "prioritize_high_intent_leads";

export type MarketplaceActionType =
  | "FLAG_LISTING_REVIEW"
  | "CREATE_INTERNAL_TASK"
  | "ADD_INTERNAL_NOTE"
  | "APPROVE_LISTING"
  | "REJECT_LISTING"
  | "MARK_BOOKING_GUEST_PAID"
  | "RECORD_CHECKIN"
  | "APPROVE_PAYOUT"
  | "MARK_PAYOUT_PAID";

export type MarketplaceSignalSeverity = "info" | "warning" | "critical";

export type MarketplaceSignal = {
  /** Deterministic id: type + entity + reasonCode (no random). */
  id: string;
  type: MarketplaceSignalType;
  severity: MarketplaceSignalSeverity;
  entityType: MarketplaceEntityType;
  entityId: string | null;
  reasonCode: string;
  metrics: Record<string, number>;
  explanation: string;
};

export type MarketplaceOpportunity = {
  id: string;
  type: MarketplaceOpportunityType;
  sourceSignalTypes: MarketplaceSignalType[];
  entityType: MarketplaceEntityType;
  entityId: string | null;
  title: string;
  rationale: string;
  /** Higher = more urgent for ordering (deterministic tie-break elsewhere). */
  priority: number;
};

export type MarketplaceProposalPolicyOutcome = "allowed" | "blocked" | "approval_required";

export type MarketplacePolicyEvaluation = {
  sensitiveFinancialBlocked: boolean;
  listingMutationBlocked: boolean;
  /** Per-opportunity lane before proposals materialize. */
  opportunityOutcomes: Record<string, { outcome: MarketplaceProposalPolicyOutcome; reasons: readonly string[] }>;
  notes: readonly string[];
};

export type MarketplaceRiskLevel = "low" | "medium" | "high";

export type MarketplaceActionProposal = {
  id: string;
  actionType: MarketplaceActionType;
  entityType: MarketplaceEntityType;
  entityId: string | null;
  opportunityId: string;
  riskLevel: MarketplaceRiskLevel;
  reasons: readonly string[];
  payload: Record<string, unknown>;
};

export type MarketplaceGovernanceMode =
  | "OFF"
  | "RECOMMEND_ONLY"
  | "SAFE_AUTOPILOT"
  | "FULL_AUTOPILOT_APPROVAL";

export type MarketplaceExecutionGateStatus = "blocked" | "dry_run_only" | "pending_approval" | "ready";

export type MarketplaceExecutionGateEvaluation = {
  allowed: boolean;
  requiresApproval: boolean;
  blockedReasons: readonly string[];
  executableStatus: MarketplaceExecutionGateStatus;
};

export type MarketplaceAutonomySummary = {
  builtAt: string;
  governanceMode: MarketplaceGovernanceMode;
  signalCount: number;
  opportunityCount: number;
  proposalCount: number;
  executedCount: number;
  blockedCount: number;
  pendingApprovalCount: number;
  dryRun: boolean;
  notes: readonly string[];
};

export type MarketplaceOutcomeFeedback = {
  periodStart: string;
  periodEnd: string;
  /** Deterministic ratios from aggregates — no ML. */
  viewsToLeadsRatio: number | null;
  leadsToBookingsRatio: number | null;
  listingQualityDeltaHint: number | null;
  trustRiskFlagsCount: number;
  executedActionSuccessRate: number | null;
  notes: readonly string[];
};

/** Normalized read-model for detectors — built from Syria Prisma aggregates only. */
export type DarlinkListingSnapshotRow = {
  id: string;
  status: string;
  type: string;
  fraudFlag: boolean;
  price: string;
  city: string;
  isFeatured: boolean;
  featuredPriority: number;
  updatedAt: string;
  createdAt: string;
  qualityScoreApprox: number | null;
};

export type DarlinkBookingSnapshotRow = {
  id: string;
  propertyId: string;
  status: string;
  guestPaymentStatus: string;
  payoutStatus: string;
  fraudFlag: boolean;
  totalPrice: string;
  checkedInAt: string | null;
  checkIn: string;
  createdAt: string;
};

export type DarlinkPayoutSnapshotRow = {
  id: string;
  bookingId: string;
  hostId: string;
  status: string;
  amount: string;
  currency: string;
};

export type DarlinkLeadSnapshotRow = {
  id: string;
  propertyId: string;
  createdAt: string;
};

export type DarlinkGrowthMetricsSnapshot = {
  /** Count growth events keyed by eventType since window. */
  eventsByType: Record<string, number>;
  /** Window start ISO. */
  windowStart: string;
};

export type DarlinkMarketplaceSnapshot = {
  builtAt: string;
  scope: {
    mode: "listing" | "portfolio";
    listingId?: string | null;
  };
  listings: DarlinkListingSnapshotRow[];
  bookings: DarlinkBookingSnapshotRow[];
  payouts: DarlinkPayoutSnapshotRow[];
  leads: DarlinkLeadSnapshotRow[];
  aggregates: {
    totalListings: number;
    pendingReviewListings: number;
    featuredListings: number;
    fraudFlaggedListings: number;
    stalePublishedLikeCount: number;
    totalBookings: number;
    payoutsPending: number;
    payoutsPaid: number;
    inquiriesLast30d: number;
    activeBnhubListings: number;
  };
  trustHints: {
    fraudListedCount: number;
    fraudBookingCount: number;
  };
  rankingHints: {
    avgFeaturedPriority: number;
  };
  growthMetrics: DarlinkGrowthMetricsSnapshot | null;
  executionRecent: readonly {
    actionType: string;
    outcome: string;
    createdAt: string;
  }[];
  autopilotRecommendationsPending: number;
  notes: readonly string[];
};
