import type { LegalHubActorType, LegalHubSignals, LegalWorkflowState, LegalRiskItem } from "./legal.types";

/** Aggregated readiness — platform tracking only (not legal advice). */
export type LegalReadinessLevel = "not_ready" | "partial" | "mostly_ready" | "ready";

export type LegalEnforcementMode = "none" | "soft" | "hard";

export type LegalGateResult = {
  allowed: boolean;
  mode: LegalEnforcementMode;
  reasons: string[];
  blockingRequirements: string[];
};

export type LegalReadinessScore = {
  score: number;
  level: LegalReadinessLevel;
  missingCritical: number;
  missingOptional: number;
  completed: number;
  total: number;
};

/** Actions that can be gated by deterministic compliance rules (no automation of approvals). */
export type LegalGateAction =
  | "publish_listing"
  | "start_booking"
  | "complete_booking"
  | "submit_offer"
  | "accept_offer"
  | "activate_host_listing"
  | "unlock_contact"
  | "become_broker";

/** Inputs to {@link evaluateLegalGate} — must be constructible without DB inside the gate engine. */
export type LegalGateContext = {
  actorType: LegalHubActorType;
  workflows: LegalWorkflowState[];
  risks: LegalRiskItem[];
  signals?: Partial<LegalHubSignals>;
};
