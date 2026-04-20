export type { AutonomyMode } from "./types/autonomy.types";

export type { AutonomyConfig } from "@prisma/client";

/** Normalized BNHub signals for autonomy (deterministic inputs only). */
export type AutonomySignals = {
  scopeType: string;
  scopeId: string;
  grossRevenue: number;
  occupancyRate: number;
  adr: number;
  revpar: number;
  bookingCount: number;
  revenueTrend: number;
};

export type AutonomyActionCandidate = {
  domain: string;
  actionType: string;
  signalKey?: string;
  /** AutonomyRuleWeight row — set after contextual / bandit ranking (auditable arm id). */
  ruleWeightId?: string;
  /** Feature-aware contextual component (deterministic buckets + stored stats). */
  contextualScore?: number;
  /** Combined ranking score persisted as `confidence` on `AutonomyAction`. */
  selectionScore?: number;
  contextFeatures?: Record<string, string>;
  payload: Record<string, unknown>;
  reason: string;
  confidence: number;
};

export type PolicyResult = {
  allowed: boolean;
  reason?: string;
};

export type ExecuteResult = {
  status: "proposed" | "approved" | "executed" | "skipped" | "rejected";
  detail?: string;
  executedAt?: Date;
};
