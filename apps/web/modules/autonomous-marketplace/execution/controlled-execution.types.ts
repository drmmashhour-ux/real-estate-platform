/**
 * Controlled execution layer — pure types (no runtime logic).
 */

import type { ExecutionResult } from "../types/domain.types";

export type ControlledExecutionStatus =
  | "not_started"
  | "skipped"
  | "dry_run"
  | "pending_approval"
  | "executed"
  | "failed"
  | "rolled_back"
  | "blocked";

export type ControlledExecutionReason =
  | "policy_block"
  | "governance_recommend_only"
  | "governance_require_approval"
  | "dry_run_forced"
  | "config_disabled"
  | "compliance_block"
  | "risk_block"
  | "execution_success"
  | "execution_failure"
  | "rollback_applied"
  /** Regional capability / jurisdiction posture — mirrors `SafeExecutionGateInput.regionExecutionProfile`. */
  | "region_capability_block"
  | "region_recommend_only"
  /** @deprecated prefer region_capability_block — retained for serialized audit compatibility */
  | "region_execution_blocked"
  | "legal_risk_critical"
  | "legal_risk_require_approval";

export type ComplianceGateSnapshot = {
  blocked: boolean;
  /** Stable machine code — no free-form PII. */
  reasonCode?: string;
};

export type LegalRiskSnapshot = {
  /** 0–100 inclusive; deterministic upstream feed. */
  score: number;
};

export type TrustRiskSnapshot = {
  /** Opaque stable tags from trust pipeline (no raw scores required). */
  tags: readonly string[];
};

export type ControlledExecutionRecord = {
  status: ControlledExecutionStatus;
  reasons: ControlledExecutionReason[];
  requiresApproval: boolean;
  /** Gate allowed real execution path (still subject to executor outcome). */
  gateAllowedLive: boolean;
};

export type ControlledActionApplicationResult = {
  ok: boolean;
  record: ControlledExecutionRecord;
  executionResult?: ExecutionResult;
  errorMessage?: string;
};

export type ControlledExecutionBatchResult = {
  results: ControlledActionApplicationResult[];
  errors: string[];
};

export type ControlledApprovalRequirement = {
  required: boolean;
  reasons: ControlledExecutionReason[];
};

/** Single-action explainability / API payload — no side effects. */
export type ControlledExecutionDecision = {
  actionId: string;
  actionType: string;
  status: ControlledExecutionStatus;
  reasons: ControlledExecutionReason[];
  allowExecution: boolean;
  requiresApproval: boolean;
  regionCode?: string;
  source?: string;
};

/** Redacted audit row shape — mirrors persistence, not full DB model. */
export type ControlledExecutionAuditShape = {
  eventKind: "attempt" | "decision" | "outcome" | "approval" | "rollback";
  runId: string;
  actionId: string;
  actionType?: string;
  gateAllowed?: boolean;
  executionStatus?: string;
  dispositionSummary?: string;
};
