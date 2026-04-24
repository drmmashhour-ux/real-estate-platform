import type {
  MemoryDomain,
  MemoryOutcomeStatus,
  MemorySource,
  PlaybookExecutionMode,
  PlaybookScoreBand,
  PlaybookStatus,
} from "@prisma/client";

export type {
  MemoryDomain,
  MemoryOutcomeStatus,
  MemorySource,
  PlaybookExecutionMode,
  PlaybookScoreBand,
  PlaybookStatus,
};

/** Comparable context for fingerprinting + retrieval (deterministic). */
export type PlaybookComparableContext = {
  domain: MemoryDomain;
  entityType: string;
  entityId?: string;
  market?: {
    country?: string;
    province?: string;
    city?: string;
    neighborhood?: string;
    season?: string;
    demandBand?: string;
  };
  segment?: {
    /** e.g. landing, campaign id */
    source?: string;
    propertyType?: string;
    bedrooms?: number;
    budgetBand?: string;
    leadType?: string;
    urgency?: string;
    language?: string;
    hostTier?: string;
  };
  signals?: Record<string, string | number | boolean | null>;
};

export type RecordDecisionInput = {
  source: MemorySource;
  triggerEvent: string;
  actionType: string;
  actionVersion?: string;
  actorUserId?: string;
  actorSystem?: string;
  actorRole?: string;
  /** Maps to `memoryPlaybookId` in the database. */
  playbookId?: string;
  /** Maps to `memoryPlaybookVersionId` in the database. */
  playbookVersionId?: string;
  memoryPlaybookId?: string;
  memoryPlaybookVersionId?: string;
  listingId?: string;
  leadId?: string;
  dealId?: string;
  bookingId?: string;
  brokerId?: string;
  customerId?: string;
  context: PlaybookComparableContext;
  actionPayload: Record<string, unknown>;
  policySnapshot?: Record<string, unknown>;
  riskSnapshot?: Record<string, unknown>;
  objectiveSnapshot?: Record<string, unknown>;
  initialConfidence?: number;
  safetyScore?: number;
  expectedValue?: number;
  idempotencyKey?: string;
};

/** Outcome status literals (match `MemoryOutcomeStatus` in Prisma). */
export type MemoryOutcomeStatusLiteral =
  | "PENDING"
  | "PARTIAL"
  | "SUCCEEDED"
  | "FAILED"
  | "NEUTRAL"
  | "CANCELLED";

export type RecordOutcomeUpdateInput = {
  memoryRecordId: string;
  outcomeStatus: MemoryOutcomeStatusLiteral;
  outcomeSummary?: Record<string, unknown>;
  realizedValue?: number | null;
  realizedRevenue?: number | null;
  realizedConversion?: number | null;
  realizedLatencyMs?: number | null;
  realizedRiskScore?: number | null;
};

export type AppendOutcomeMetricInput = {
  memoryRecordId: string;
  metricKey: string;
  metricValue?: number;
  metricText?: string;
  metricJson?: Record<string, unknown>;
  observedAt?: Date;
  source?: string;
};

/** Wave 7: playbook-first recs with policy gating. */
export type PlaybookRecommendation = {
  /** Discriminator for mixed API payloads. */
  itemType: "playbook";
  playbookId: string;
  playbookVersionId: string | null;
  key: string;
  name: string;
  actionType: string | null;
  score: number;
  confidence: number;
  allowed: boolean;
  blockedReasons: string[];
  rationale: string[];
  executionMode: "RECOMMEND_ONLY" | "HUMAN_APPROVAL" | "SAFE_AUTOPILOT" | "FULL_AUTOPILOT";
  /** Unboosted model score (before small ACTIVE / version nudges). */
  baseRecommendationScore?: number;
  /** Optional extra lines for assignment (does not replace `rationale`). */
  assignmentRationale?: string[];
  /** Wave 12: how this row was produced in the intelligence layer. */
  intelligenceSource?: "native" | "transfer";
  /** Wave 12: when `intelligenceSource` is `transfer`, human-readable cross-domain context. */
  crossDomainMetadata?: { requestDomain: string; candidateDomain: string; rationale: string[] };
};

export type MemoryRecommendationItem = {
  itemType: "memory";
  memoryId: string;
  actionType: string;
  score: number;
  confidence: number;
  rationale: string[];
  allowed: boolean;
  blockedReasons: string[];
};

export type PlaybookOrMemoryRecommendation = PlaybookRecommendation | MemoryRecommendationItem;

export type RecommendationRequestContext = {
  domain:
    | "GROWTH"
    | "PRICING"
    | "LEADS"
    | "DEALS"
    | "LISTINGS"
    | "DREAM_HOME"
    | "MESSAGING"
    | "PROMOTIONS"
    | "BOOKINGS"
    | "BROKER_ROUTING"
    | "RISK";
  entityType: string;
  market?: Record<string, string | number | boolean | null>;
  segment?: Record<string, string | number | boolean | null>;
  signals?: Record<string, string | number | boolean | null>;
  policyFlags?: { criticalBlock?: boolean };
  autonomyMode?: "OFF" | "ASSIST" | "SAFE_AUTOPILOT" | "FULL_AUTOPILOT";
  /** When set, only consider these playbook ids (must match the domain). */
  candidatePlaybookIds?: string[];
};

export type RetrievalContextInput = {
  context: PlaybookComparableContext;
  autonomyModeHint?: PlaybookExecutionMode;
  /** Optional playbook ids to bias ranking. */
  candidatePlaybookIds?: string[];
  policyFlags?: { criticalBlock?: boolean };
  /** Wave 7: user/request autonomy (distinct from `autonomyModeHint` — prefer this when set). */
  autonomyMode?: RecommendationRequestContext["autonomyMode"];
};

export type PolicyGateResult = {
  allowed: boolean;
  blockedReasons: string[];
};

export type FingerprintResult = {
  segmentKey: string;
  marketKey: string;
  fingerprint: string;
  features: Record<string, unknown>;
};

export type RankedPlaybookCandidate = {
  playbookId: string;
  score: number;
  rank: number;
};

export type AggregatePlaybookStats = {
  totalMemories: number;
  successes: number;
  failures: number;
  avgRealizedValue: number | null;
  avgRealizedRevenue: number | null;
  avgConversionLift: number | null;
  avgRiskScore: number | null;
  numericScore: number;
  scoreBand: PlaybookScoreBand;
};

/** Wave 8: controlled execution (plan only; no implicit automation). */
export type PlaybookExecutionPlan = {
  playbookId: string;
  playbookVersionId: string | null;
  actionType: string | null;
  /** May include `assignmentId`, `memoryContext`, `context` from the execute API. */
  payload: Record<string, unknown>;
  executionMode: "RECOMMEND_ONLY" | "HUMAN_APPROVAL" | "SAFE_AUTOPILOT" | "FULL_AUTOPILOT";
};

export type PlaybookExecutionResult = {
  success: boolean;
  executed: boolean;
  mode: "RECOMMEND_ONLY" | "HUMAN_APPROVAL" | "SAFE_AUTOPILOT" | "FULL_AUTOPILOT";
  reason?: string;
  /** When set, plain-language allow/deny detail (same intent as the machine `reason`). */
  explanation?: string;
};

/** Wave 9: single bandit (lite) pick result; assignment row is the audit log. */
export type PlaybookAssignmentResult = {
  assignmentId: string;
  playbookId: string;
  playbookVersionId: string | null;
  selectionMode: "exploit" | "explore" | "manual";
  recommendationScore: number;
  selectionScore: number;
  executionMode: "RECOMMEND_ONLY" | "HUMAN_APPROVAL" | "SAFE_AUTOPILOT" | "FULL_AUTOPILOT";
  rationale: string[];
};

export type PlaybookBanditContext = {
  domain:
    | "GROWTH"
    | "PRICING"
    | "LEADS"
    | "DEALS"
    | "LISTINGS"
    | "DREAM_HOME"
    | "MESSAGING"
    | "PROMOTIONS"
    | "BOOKINGS"
    | "BROKER_ROUTING"
    | "RISK";
  entityType: string;
  entityId?: string;
  market?: Record<string, string | number | boolean | null>;
  segment?: Record<string, string | number | boolean | null>;
  signals?: Record<string, string | number | boolean | null>;
  autonomyMode?: "OFF" | "ASSIST" | "SAFE_AUTOPILOT" | "FULL_AUTOPILOT";
  policyFlags?: { criticalBlock?: boolean };
  /** When set, overrides default 0.15. Clamped 0.05..0.35. */
  explorationRate?: number;
  candidatePlaybookIds?: string[];
};

