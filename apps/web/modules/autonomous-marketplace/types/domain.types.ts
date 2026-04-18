/**
 * LECIPM Autonomous Marketplace — shared with Manager AI / growth OS.
 * @see ManagerAiHostAutopilotSettings, feature flag FEATURE_AUTONOMOUS_MARKETPLACE_V1
 */

export type AutonomyMode = "OFF" | "ASSIST" | "SAFE_AUTOPILOT" | "FULL_AUTOPILOT_APPROVAL";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type ExecutionStatus =
  | "SKIPPED"
  | "BLOCKED"
  | "APPROVED"
  | "EXECUTED"
  | "FAILED"
  | "DRY_RUN"
  | "REQUIRES_APPROVAL";

export type SignalType =
  | "listing_performance"
  | "listing_content_quality"
  | "promotion_activity"
  | "campaign_performance"
  | "lead_funnel"
  | "booking_conversion"
  | "host_broker_engagement";

export type ActionType =
  | "UPDATE_LISTING_COPY"
  | "REFRESH_LISTING_CONTENT"
  | "SUGGEST_AMENITIES_COMPLETION"
  | "SUGGEST_PRICE_CHANGE"
  | "APPLY_PRICE_CHANGE"
  | "START_PROMOTION"
  | "STOP_PROMOTION"
  | "SCALE_CAMPAIGN_BUDGET"
  | "REDUCE_CAMPAIGN_BUDGET"
  | "SEND_LEAD_FOLLOWUP"
  | "CREATE_TASK"
  | "FLAG_REVIEW"
  | "REQUEST_HUMAN_APPROVAL";

/** @deprecated use TargetType — kept for grep compatibility */
export type DomainTargetType = TargetType;

export type TargetType =
  | "fsbo_listing"
  /** Syria `syria_*` region rows — preview/read-only from web in this phase. */
  | "syria_listing"
  | "short_term_listing"
  | "lead"
  | "campaign"
  | "broker_user"
  | "scan";

export type DomainTarget = {
  type: TargetType;
  id: string | null;
  label?: string;
};

export type MarketplaceSignalBase = {
  id: string;
  signalType: SignalType;
  observedAt: string;
  source: string;
  confidence: number;
  explanation: string;
  metadata: Record<string, unknown>;
};

export type ListingPerformanceSignal = MarketplaceSignalBase & {
  signalType: "listing_performance";
  metadata: {
    listingId: string;
    views?: number;
    saves?: number;
    contacts?: number;
    conversionRate?: number;
    daysOnMarket?: number;
    titleLen?: number;
    descriptionLen?: number;
    photoCount?: number;
    amenitiesScore?: number;
  };
};

export type ListingContentQualitySignal = MarketplaceSignalBase & {
  signalType: "listing_content_quality";
  metadata: {
    listingId: string;
    weakTitle?: boolean;
    weakDescription?: boolean;
    guestCountPresent?: boolean;
  };
};

export type PromotionActivitySignal = MarketplaceSignalBase & {
  signalType: "promotion_activity";
  metadata: {
    listingId: string;
    featuredActive?: boolean;
    activePromotionCount?: number;
  };
};

export type CampaignPerformanceSignal = MarketplaceSignalBase & {
  signalType: "campaign_performance";
  metadata: {
    campaignKey: string;
    impressions?: number;
    clicks?: number;
    leads?: number;
    spend?: number;
    ctr?: number;
    conversionRate?: number;
    classification?: string;
  };
};

export type LeadFunnelSignal = MarketplaceSignalBase & {
  signalType: "lead_funnel";
  metadata: {
    leadId: string;
    pipelineStage?: string;
    score?: number;
    hoursSinceCreated?: number;
    hoursSinceFollowUp?: number;
    followUpAttempts?: number;
    unlocked?: boolean;
  };
};

export type BookingConversionSignal = MarketplaceSignalBase & {
  signalType: "booking_conversion";
  metadata: {
    listingId?: string;
    bookingsStarted?: number;
    bookingsCompleted?: number;
    checkoutAbandonRate?: number;
  };
};

export type HostBrokerEngagementSignal = MarketplaceSignalBase & {
  signalType: "host_broker_engagement";
  metadata: {
    userId?: string;
    hostListingCount?: number;
    lastHostActivityHours?: number;
    brokerLeadTouches?: number;
  };
};

export type MarketplaceSignal =
  | ListingPerformanceSignal
  | ListingContentQualitySignal
  | PromotionActivitySignal
  | CampaignPerformanceSignal
  | LeadFunnelSignal
  | BookingConversionSignal
  | HostBrokerEngagementSignal;

export type Opportunity = {
  id: string;
  detectorId: string;
  title: string;
  explanation: string;
  confidence: number;
  risk: RiskLevel;
  evidence: Record<string, unknown>;
  proposedActions: ProposedAction[];
  createdAt: string;
};

export type ProposedAction = {
  id: string;
  type: ActionType;
  target: DomainTarget;
  confidence: number;
  risk: RiskLevel;
  title: string;
  explanation: string;
  humanReadableSummary: string;
  metadata: Record<string, unknown>;
  suggestedAt: string;
  sourceDetectorId: string;
  opportunityId: string;
};

export type PolicyRuleResultType = "passed" | "blocked" | "warning";

export type PolicyViolation = {
  code: string;
  message: string;
  ruleCode: string;
  metadata?: Record<string, unknown>;
};

export type PolicyWarning = {
  code: string;
  message: string;
  ruleCode: string;
};

export type PolicyDisposition = "BLOCK" | "ALLOW" | "ALLOW_WITH_APPROVAL" | "ALLOW_DRY_RUN";

export type PolicyDecision = {
  id: string;
  actionId: string;
  disposition: PolicyDisposition;
  violations: PolicyViolation[];
  warnings: PolicyWarning[];
  evaluatedAt: string;
  ruleResults: PolicyRuleEvaluation[];
};

export type PolicyRuleEvaluation = {
  ruleCode: string;
  result: PolicyRuleResultType;
  dispositionHint?: PolicyDisposition;
  reason?: string;
  metadata?: Record<string, unknown>;
};

/** Final operator-facing path — aligned with internal runbooks */
export type GovernanceDisposition =
  | "RECOMMEND_ONLY"
  | "DRY_RUN"
  | "REQUIRE_APPROVAL"
  | "AUTO_EXECUTE";

export type GovernanceResolution = {
  disposition: GovernanceDisposition;
  reason: string;
  allowExecution: boolean;
  allowDryRun: boolean;
};

export type ExecutionResult = {
  status: ExecutionStatus;
  startedAt: string;
  finishedAt: string;
  detail: string;
  /** Present for dry-run / simulated outcomes (same text as `detail` when set). */
  message?: string;
  metadata: Record<string, unknown>;
  errorCode?: string;
};

export type OutcomeSnapshot = {
  recordedAt: string;
  target: DomainTarget;
  beforeSummary: Record<string, unknown>;
  afterSummary: Record<string, unknown>;
  notes?: string;
};

export type AutonomousRunSummary = {
  runId: string;
  target: DomainTarget;
  autonomyMode: AutonomyMode;
  dryRun: boolean;
  status: "completed" | "partial_failure" | "failed";
  signalsSummary: Record<string, unknown>;
  opportunitiesFound: number;
  actionsProposed: number;
  actionsBlocked: number;
  actionsApproved: number;
  actionsRequiringApproval: number;
  actionsExecuted: number;
  actionsDryRun: number;
  warnings: string[];
  errors: string[];
  metrics: {
    policyBlocked: number;
    governanceSkipped: number;
    executorFailures: number;
  };
};

export type AutonomousRun = {
  summary: AutonomousRunSummary;
  observation: ObservationSnapshot;
  opportunities: Opportunity[];
  actions: Array<{
    proposed: ProposedAction;
    policy: PolicyDecision;
    governance: GovernanceResolution;
    execution: ExecutionResult;
  }>;
};

export type ObservationSnapshot = {
  id: string;
  target: DomainTarget;
  signals: MarketplaceSignal[];
  aggregates: Record<string, number>;
  facts: Record<string, unknown>;
  builtAt: string;
};
