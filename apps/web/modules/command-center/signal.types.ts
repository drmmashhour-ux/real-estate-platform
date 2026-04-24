/**
 * Unified marketplace intelligence signal — auditable, explainable, actionable.
 */

export type SignalDomain = "TRUST" | "DEAL" | "LEAD" | "RISK" | "MARKETING" | "EXPANSION";

export type SignalSeverity = "INFO" | "WARNING" | "CRITICAL";

export type SignalActionKind = "navigate" | "assistant" | "trigger";

/** Serializable provenance for audits and deep links. */
export type SignalSource =
  | { engine: "trust_score"; targetType?: string; targetId?: string }
  | { engine: "reputation_layer" }
  | { engine: "dispute_prediction"; snapshotId?: string }
  | { engine: "deal_intelligence"; dealId?: string }
  | { engine: "lead_funnel"; leadId?: string }
  | { engine: "marketing_engine"; jobId?: string }
  | { engine: "ai_ceo"; adjustmentId?: string }
  | { engine: "visit_booking"; visitId?: string }
  | { engine: "aggregated" };

export type SignalAction = {
  id: string;
  label: string;
  kind: SignalActionKind;
  /** In-app navigation (locale-aware routing handled by Link). */
  href?: string;
  /** When true, operator must complete governed approval flow (no silent automation). */
  requiresApproval?: boolean;
  /** Optional API route for programmatic actions (POST). Caller validates session + role. */
  postHref?: string;
};

export type Signal = {
  id: string;
  domain: SignalDomain;
  severity: SignalSeverity;
  title: string;
  /** Primary metric or headline value (human-readable). */
  value: string;
  /** Trend or period delta, when known. */
  delta: string | null;
  explanation: string;
  recommendedActions: SignalAction[];
  source: SignalSource;
  timestamp: string;
  /** Relative priority for sorting when severity ties (0–100). */
  impact: number;
};

export type SignalPriorityZone = "critical" | "attention" | "healthy";

export type SignalsByZone = Record<SignalPriorityZone, Signal[]>;

export type MarketplaceHealthPayload = {
  overallLevel: "healthy" | "attention" | "urgent";
  headline: string;
  trustScore: number | null;
  trustBand: string | null;
  disputeRiskScore: number | null;
  openDisputes: number;
  biggestRisks: string[];
  biggestImprovements: string[];
  quickActions: SignalAction[];
};

export type StrategicRecommendation = {
  id: string;
  title: string;
  explanation: string;
  expectedImpact: string;
  actions: SignalAction[];
  source: SignalSource;
  requiresApproval: boolean;
};

export type IntelligenceFeedItem = {
  id: string;
  domain: SignalDomain;
  title: string;
  explanation: string;
  recommendedActions: SignalAction[];
  href: string;
  createdAt: string;
  severity: SignalSeverity;
  icon: "calendar" | "user" | "briefcase" | "shield" | "alert" | "spark" | "chart";
};
