/**
 * LECIPM AI Autopilot Layer — assistive only; never autonomous legal commitment.
 */

export const AUTOPILOT_MODES = ["OFF", "ASSIST", "SAFE_AUTOPILOT", "FULL_AUTOPILOT_APPROVAL"] as const;
export type AutopilotLayerMode = (typeof AUTOPILOT_MODES)[number];

export const ACTION_STATUSES = ["PROPOSED", "APPROVED", "EXECUTED", "REJECTED", "BLOCKED"] as const;
export type AutopilotLayerActionStatus = (typeof ACTION_STATUSES)[number];

export const RISK_LEVELS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export type AutopilotRiskLevel = (typeof RISK_LEVELS)[number];

/** User-facing disclaimer (FR) required on automated outputs. */
export const AUTOPILOT_DISCLAIMER_FR = "Suggestion automatisée — à valider avant utilisation.";

export type AutopilotPlanContext = {
  userId: string;
  draftId?: string | null;
  dealId?: string | null;
  role: string;
  transactionType?: string | null;
  turboDraftStatus?: string | null;
  /** When false, notice engine reports missing mandatory notices. */
  noticesComplete?: boolean;
  /** Contract brain / workflow gate — e.g. blocked | ok */
  contractBrainGate?: string | null;
  turboDraftCanProceed?: boolean;
  /** AI correction / memory critical findings */
  aiCriticalFindings?: boolean;
  aiFindingsSummary?: string | null;
  paymentStatus?: string | null;
  /** Buyer/seller representation — e.g. BUYER_NOT_REPRESENTED */
  representedStatus?: string | null;
  /** Optional structured risks from drafting */
  risks?: { code?: string; severity?: string; message?: string }[];
};

export type PlannedAutopilotAction = {
  actionKey: string;
  actionType: string;
  mode: AutopilotLayerMode;
  riskLevel: AutopilotRiskLevel;
  reasonFr: string;
  requiresApproval: boolean;
  payloadJson?: Record<string, unknown>;
};

export type GuardResult =
  | { ok: true }
  | { ok: false; reason: string; reasonFr: string; eventKey: "autopilot_guard_failed" };

export type BlockedActionResult = {
  status: "BLOCKED";
  blockReason: string;
  blockReasonFr: string;
};
