export type AutonomousDecisionDomain =
  | "ads"
  | "leads"
  | "pricing"
  | "routing"
  | "broker"
  | "conversion";

export type AutonomousDecisionImpact = "low" | "medium" | "high";

export type AutonomousDecision = {
  id: string;
  domain: AutonomousDecisionDomain;
  action: string;
  rationale: string[];
  confidence: number;
  requiresApproval: boolean;
  impact: AutonomousDecisionImpact;
};

export type AutonomousSystemStatus = "idle" | "active" | "review_required";

export type AutonomousSystemState = {
  decisions: AutonomousDecision[];
  status: AutonomousSystemStatus;
};

export type AutonomousDecisionContext = {
  /** Signals from Growth / CRM (deterministic inputs only). */
  leadCount30d: number;
  highScoreLeadCount: number;
  /** Proxy: ads funnel has positive lead capture in last window (from metrics or false). */
  adsPerforming: boolean;
  /** Governance: when true, high-impact decisions stay draft-only. */
  governanceRestricted: boolean;
};
