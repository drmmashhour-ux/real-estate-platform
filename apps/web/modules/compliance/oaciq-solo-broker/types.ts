/** AI / assistant semantics — guide & validate, never substitute for supervisory duties of an EO. */
export type AiComplianceRole = {
  readonly guide: true;
  readonly coach: true;
  readonly validator: true;
  readonly supervisor: false;
};

/** Canonical assistant role flags (immutable object). */
export const AI_COMPLIANCE_ROLE: AiComplianceRole = {
  guide: true,
  coach: true,
  validator: true,
  supervisor: false,
};

/** Solo-broker onboarding / ongoing checks (adapted from OACIQ “selection” themes). */
export type BrokerVerificationVector = {
  licenceCheck: "required" | "pending" | "failed";
  competenceCheck: "required" | "pending" | "passed";
  integrityFlagCheck: "required" | "pending" | "cleared";
  identityVerification: "required" | "pending" | "verified";
};

/** Actions that must be restricted to licensed brokers acting within scope. */
export type BrokerOnlyAction =
  | "represent_client"
  | "negotiate"
  | "draft_offer"
  | "advise"
  | "execute_mandate"
  | "present_counter_offer";

/** Education modules (§4 training / coaching — delivered as product education, not EO supervision). */
export type SoloBrokerEducationModuleId =
  | "oaciq_rules_overview"
  | "broker_responsibilities"
  | "legal_obligations_reba"
  | "fraud_prevention"
  | "conflict_of_interest";

export type EducationTrigger =
  | "first_use"
  | "new_feature"
  | "high_risk_action"
  | "verification_failed"
  | "annual_refresh";

/** §5 Feedback / monitoring — operational telemetry (not performance reviews). */
export type ComplianceLogCategory =
  | "warning"
  | "blocked_action"
  | "risk_flag"
  | "broker_confirmation"
  | "audit_signature";

export type ComplianceRiskTier = "LOW" | "MEDIUM" | "HIGH";

/** Outcome of a gated operation under solo-broker rules. */
export type ComplianceGateOutcome =
  | { decision: "allowed"; tier: ComplianceRiskTier }
  | { decision: "warning"; tier: ComplianceRiskTier; reasonCode: string }
  | { decision: "blocked"; tier: "HIGH"; reasonCode: string };

/** Audit trail entry (§9). */
export type SoloBrokerAuditFields = {
  actorId: string;
  actionKey: string;
  at: string; // ISO timestamp
  decision: "allowed" | "warned" | "blocked";
  /** Freeform or structured client reference id */
  correlationId?: string;
  signatureReference?: string | null;
  metadata?: Record<string, unknown>;
};
