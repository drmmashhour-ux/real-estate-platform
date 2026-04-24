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

export type PlaybookRecommendation = {
  playbookId: string;
  playbookVersionId: string;
  name: string;
  score: number;
  confidence: number;
  rationale: string[];
  executionMode: PlaybookExecutionMode;
  allowed: boolean;
  blockedReasons: string[];
};

export type RetrievalContextInput = {
  context: PlaybookComparableContext;
  autonomyModeHint?: PlaybookExecutionMode;
  /** Optional playbook ids to bias ranking. */
  candidatePlaybookIds?: string[];
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

