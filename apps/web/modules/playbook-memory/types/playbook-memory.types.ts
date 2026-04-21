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

export type RecordOutcomeUpdateInput = {
  memoryRecordId: string;
  outcomeStatus?: MemoryOutcomeStatus;
  outcomeSummary?: Record<string, unknown>;
  realizedValue?: number;
  realizedRevenue?: number;
  realizedConversion?: number;
  realizedLatencyMs?: number;
  realizedRiskScore?: number;
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
