/**
 * Growth governance — advisory classification only; does not change execution or flags.
 *
 * Expanded spec (V1): status drives advisory posture; `blockedDomains` / `frozenDomains` are labels for
 * operator UX and downstream hints — not runtime kill switches. `humanReviewItems` remains a compact
 * string list for legacy consumers; `humanReviewQueue` holds structured items when escalation is enabled.
 */

export type GrowthGovernanceStatus =
  | "healthy"
  | "watch"
  | "caution"
  | "freeze_recommended"
  | "human_review_required";

export type GrowthGovernanceDomain = "leads" | "ads" | "cro" | "content" | "autopilot" | "fusion";

export type GrowthGovernanceSignal = {
  id: string;
  category: GrowthGovernanceDomain;
  severity: "low" | "medium" | "high";
  title: string;
  description: string;
  reason: string;
};

export type GrowthHumanReviewItem = {
  id: string;
  title: string;
  reason: string;
  category: GrowthGovernanceDomain;
  severity: "low" | "medium" | "high";
};

export type GrowthGovernanceDecision = {
  status: GrowthGovernanceStatus;
  /** Structured risks (severity, domain, copy) — capped at evaluation time. */
  topRisks: GrowthGovernanceSignal[];
  /**
   * Domains deprioritized for suggested / promotional automation until review.
   * Populated from concrete signals; may be extended by status (e.g. HR → autopilot).
   */
  blockedDomains: GrowthGovernanceDomain[];
  /**
   * Advisory “hold” domains from `getGrowthFreezeState(decision)` — scaling narratives frozen until review.
   */
  frozenDomains: GrowthGovernanceDomain[];
  /** One-line summaries for simple consumers and when escalation is off. */
  humanReviewItems: string[];
  /** Structured queue when `FEATURE_GROWTH_GOVERNANCE_ESCALATION_V1` is on. */
  humanReviewQueue: GrowthHumanReviewItem[];
  notes: string[];
  createdAt: string;
};

export type GrowthGovernanceFreezeState = {
  frozenDomains: GrowthGovernanceDomain[];
  blockedDomains: GrowthGovernanceDomain[];
  rationale: string[];
};

/** Internal snapshot for escalation + tests — not persisted. */
export type GrowthGovernanceContext = {
  leadsToday: number;
  totalEarlyConversionLeads: number;
  campaignsAttributed: number;
  adsInsightsProblems: string[];
  adsHealth: "STRONG" | "OK" | "WEAK";
  weakCampaignDominant: boolean;
  autopilotRejected: number;
  autopilotPending: number;
  /** High-score items queued or due (score-based backlog). */
  followUpHighIntentQueued: number;
  /** Items in `due_now` state (time-based pressure). */
  followUpDueNowCount: number;
  fusionSummaryStatus: "weak" | "moderate" | "strong" | null;
  fusionSnapshotWarnings: number;
  manualOnlyAutopilotCount: number;
  contentAssistEnabled: boolean;
  messagingAssistEnabled: boolean;
  governanceWarnings: string[];
};
