export type GrowthAutonomyLevel = "OFF" | "ASSIST" | "SAFE_AUTOPILOT" | "APPROVAL_REQUIRED";

export type GrowthDomain =
  | "MARKETING"
  | "SALES"
  | "SUPPLY"
  | "BNHUB"
  | "INVESTOR"
  | "RESIDENCE"
  | "BROKER";

export type SignalSeverity = "info" | "watch" | "important" | "critical";

export type SignalType =
  | "STRONG_TRAFFIC_WEAK_CONVERSION"
  | "STRONG_CONTENT_WEAK_LEAD_CAPTURE"
  | "HIGH_DEMAND_LOW_SUPPLY"
  | "BROKER_LEAD_RISING"
  | "CLOSE_RATE_DECLINING"
  | "BNHUB_DEMAND_SPIKE"
  | "REGION_UNDERPERFORMING"
  | "INVESTOR_INTEREST_RISING"
  | "FOLLOW_UP_DISCIPLINE_WEAK"
  | "COACHING_UPSIDE_HIGH"
  | "FORECAST_OPPORTUNITY_HIGH"
  | "PIPELINE_STAGE_LEAK"
  | "MARKETING_EFFICIENCY_GAP"
  | "SEO_TRACTION_LEAD_GAP"
  | "AUTOMATION_ENGAGEMENT_LOW";

export type NormalizedSignal = {
  signalId: string;
  signalType: SignalType;
  domain: GrowthDomain;
  severity: SignalSeverity;
  /** 0–1 */
  confidence: number;
  entityId?: string;
  region?: string;
  /** 0–1 expected relative impact if addressed */
  expectedImpact: number;
  sourceData: Record<string, string | number | boolean | null>;
  title: string;
  summary: string;
  observedAtIso: string;
};

export type GrowthOpportunity = {
  id: string;
  title: string;
  category: string;
  whyNow: string;
  expectedImpact: number;
  urgency: number;
  confidence: number;
  easeOfExecution: number;
  strategicFit: number;
  /** composite 0–1 */
  priorityScore: number;
  domain: GrowthDomain;
  sourceSignalIds: string[];
  region?: string;
};

export type ActionType =
  | "GENERATE_CONTENT"
  | "PROMOTE_LISTING"
  | "RERANK_LISTING"
  | "REROUTE_LEADS"
  | "SALES_COACHING"
  | "PRICE_REVIEW"
  | "ACTIVATE_CAMPAIGN"
  | "RETENTION_FLOW"
  | "OUTREACH_PRIORITY"
  | "APPROVAL_REQUEST"
  | "QUEUE_CONTENT_DRAFT"
  | "ROUTE_LEAD_PRIORITY"
  | "ASSIGN_TRAINING"
  | "SUGGEST_CAMPAIGN_SLOT";

export type ActionRiskLevel = "low" | "medium" | "high";

export type GrowthAction = {
  id: string;
  actionType: ActionType;
  target: string;
  reason: string;
  expectedOutcome: string;
  riskLevel: ActionRiskLevel;
  autoExecutable: boolean;
  approvalRequired: boolean;
  opportunityId: string;
  sourceSignalIds: string[];
  createdAtIso: string;
};

export type AllocationSlice = {
  label: string;
  percent: number;
  domain: GrowthDomain;
  region?: string;
  rationale: string;
  expectedImpact: number;
  confidence: number;
};

export type AllocationRecommendation = {
  slices: AllocationSlice[];
  headline: string;
  generatedAtIso: string;
};

export type LearningOutcomeKind = "approved" | "executed" | "skipped" | "rolled_back";

export type GrowthLearningRecord = {
  id: string;
  actionId: string;
  actionType: ActionType;
  outcome: LearningOutcomeKind;
  revenueDeltaCents?: number;
  leadDelta?: number;
  conversionDelta?: number;
  hub?: string;
  region?: string;
  loggedAtIso: string;
};

export type LearnedPattern = {
  id: string;
  summary: string;
  strength: number;
  context: string;
};

export type ExplainabilityPack = {
  headline: string;
  signalsReferenced: string[];
  prioritizationReason: string;
  targetMetric: string;
  confidenceExplanation: string;
  approvalExplanation: string;
};

export type GrowthBrainAlertKind =
  | "major_opportunity"
  | "revenue_leak"
  | "hub_attention"
  | "allocation_shift"
  | "forecast_shift"
  | "anomaly_spike_drop";

export type GrowthBrainAlert = {
  id: string;
  kind: GrowthBrainAlertKind;
  title: string;
  body: string;
  severity: SignalSeverity;
  createdAtIso: string;
  relatedSignalIds?: string[];
};

export type ApprovalQueueItem = {
  id: string;
  actionId: string;
  title: string;
  summary: string;
  riskLevel: ActionRiskLevel;
  status: "pending" | "approved" | "rejected";
  createdAtIso: string;
  decidedAtIso?: string;
};

export type GrowthBrainSnapshot = {
  autonomy: GrowthAutonomyLevel;
  signals: NormalizedSignal[];
  opportunities: GrowthOpportunity[];
  actions: GrowthAction[];
  allocation: AllocationRecommendation | null;
  alerts: GrowthBrainAlert[];
  approvalQueue: ApprovalQueueItem[];
  learnedPatterns: LearnedPattern[];
  weakPatterns: LearnedPattern[];
  generatedAtIso: string;
};
