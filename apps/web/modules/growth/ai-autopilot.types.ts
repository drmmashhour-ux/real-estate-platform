/**
 * AI Autopilot SAFE MODE — advisory actions + optional controlled execution (whitelist only).
 */

export type AiAutopilotActionSource = "ads" | "cro" | "leads";

export type AiAutopilotImpact = "low" | "medium" | "high";

/** manual_only = advisory / operator checklist — never auto-executed by the safe runner. */
export type AiAutopilotExecutionMode = "manual" | "manual_only" | "approval_required";

/** Domains allowed for real execution (internal-first). */
export type AiAutopilotDomain = "leads" | "internal" | "growth_admin";

/**
 * Whitelisted real-execution kinds — must match `allowedActionTypes` in execution policy.
 * Advisory-only rows omit this or use advisory-only types not in the whitelist.
 */
export type AiSafeExecutableActionType =
  | "lead_timeline_handled"
  | "lead_timeline_followup"
  | "lead_launch_sales_contacted";

export type AiAutopilotTargetType = "lead" | "none";

/** Approval workflow (human). */
export type AiAutopilotActionStatus = "pending" | "approved" | "rejected";

/** Lifecycle after run (execution plane). */
export type AiAutopilotExecutionStatus = "none" | "executed" | "failed" | "rolled_back";

export type AiAutopilotSignalStrength = "low" | "medium" | "strong";

export type AiAutopilotAction = {
  id: string;
  title: string;
  description: string;
  source: AiAutopilotActionSource;
  impact: AiAutopilotImpact;
  /** 0–1 conservative display score derived from unified snapshot evidence (not a guarantee). */
  confidence: number;
  /** 0–100 — higher = address sooner (impact × confidence × signal band). */
  priorityScore: number;
  /** One-line rationale for operators. */
  why: string;
  /** Evidence band from unified snapshot (same for all actions in a run unless overridden). */
  signalStrength: AiAutopilotSignalStrength;
  executionMode: AiAutopilotExecutionMode;
  createdAt: string;
  /** Present for whitelist-controlled execution rows; advisory snapshot rows omit. */
  actionType?: AiSafeExecutableActionType | "advisory_snapshot";
  targetId?: string;
  targetType?: AiAutopilotTargetType;
  /** Whether rollback is supported for this row. */
  reversible?: boolean;
  domain?: AiAutopilotDomain;
  executionNotes?: string;
};

export type AiAutopilotActionWithStatus = AiAutopilotAction & {
  status: AiAutopilotActionStatus;
  executionStatus?: AiAutopilotExecutionStatus;
  /** Populated when execution failed or was skipped by policy. */
  executionError?: string;
};

/** Lightweight analysis DTO — internal to autopilot pipeline only. */
export type GrowthAutopilotAnalysis = {
  evidenceQuality: string;
  preferredCta: string | null;
  weakCtaCount: number;
  weakHookCount: number;
  sqlLowCro: number;
  sqlLowRetargeting: number;
  summaryLines: string[];
};
