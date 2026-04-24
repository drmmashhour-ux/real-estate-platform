import type { Prisma } from "@prisma/client";

export type OutcomeEntityType = "lead" | "deal" | "booking" | "scenario" | "trust" | "payment" | "compliance" | "system";

export type OutcomeSource =
  | "log_hook"
  | "deal_intelligence"
  | "trust_engine"
  | "scenario_autopilot"
  | "pattern_learning"
  | "system";

/** Optional hint attached to `launch-logger` payloads for structured capture. */
export type OutcomeLogCaptureHint = {
  /** When true, the outcome pipeline persists this line (gated by outcome loop feature flag for log_hook only). */
  capture?: boolean;
  entityType: OutcomeEntityType;
  entityId: string;
  actionTaken: string;
  predictedOutcome?: Prisma.JsonValue;
  /** If lifecycle completes in the same log line, set actual. */
  actualOutcome?: Prisma.JsonValue;
  source?: OutcomeSource;
  contextUserId?: string;
};

export type OutcomeRecordInput = {
  entityType: OutcomeEntityType;
  entityId: string;
  actionTaken: string;
  predictedOutcome?: Prisma.JsonValue;
  actualOutcome?: Prisma.JsonValue;
  delta?: Prisma.JsonValue;
  source: OutcomeSource;
  logTag?: string;
  logMessage?: string;
  contextUserId?: string;
  comparisonLabel?: "match" | "miss" | "partial" | "unknown";
  errorPatternTags?: string[];
};

export type LecipmOutcomesSummary = {
  windowDays: number;
  from: string;
  to: string;
  sampleSize: number;
  /** lead funnel: won / (won+lost) from outcome events, null if no denominator. */
  conversionRate: number | null;
  dealSuccessRate: number | null;
  noShowRate: number | null;
  /** disputes opened / (disputes + clean closes proxy) from events, else null. */
  disputeRate: number | null;
  /** Share of records with both predicted and actual where boolean/numeric match (see implementation). */
  predictionAccuracy: number | null;
  /** Mean absolute error for numeric `delta` when present. */
  drift: number | null;
  learning: {
    proposedAdjustments: number;
    lastProposalAt: string | null;
  };
  /** prediction vs actual domains */
  domainBreakdown: {
    dealIntelligence: { accuracy: number | null; n: number };
    trustEngine: { accuracy: number | null; n: number };
    scenarioAutopilot: { accuracy: number | null; n: number };
  };
  improvementSeries: Array<{ day: string; accuracy: number | null; count: number }>;
  biggestWins: OutcomeWinMissRow[];
  biggestMisses: OutcomeWinMissRow[];
  alerts: OutcomeSystemAlert[];
};

export type OutcomeSystemAlert = {
  id: string;
  kind: "prediction_accuracy" | "conversion" | "dispute" | "noshow";
  title: string;
  severity: "attention" | "urgent";
  detail: string;
};

export type OutcomeWinMissRow = {
  id: string;
  title: string;
  detail: string;
  at: string;
  score: number;
};

export type SystemPerformancePanelPayload = {
  predictionAccuracy: number | null;
  improvementHint: string;
  conversionRate: number | null;
  dealSuccessRate: number | null;
  noShowRate: number | null;
  disputeRate: number | null;
  drift: number | null;
  domainBreakdown: LecipmOutcomesSummary["domainBreakdown"];
  biggestWins: OutcomeWinMissRow[];
  biggestMisses: OutcomeWinMissRow[];
  improvementSeries: LecipmOutcomesSummary["improvementSeries"];
  learningQueue: number;
  generatedAt: string;
};
