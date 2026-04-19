/**
 * Fast Deal Results Loop — measurement + attribution types (internal/admin).
 * Does not automate outreach or messaging.
 */

export type FastDealSourceType = "broker_sourcing" | "landing_capture" | "closing_playbook";

/** Fine-grained event labels (stored as sourceSubType). */
export type FastDealSourceSubType =
  | "session_started"
  | "query_copied"
  | "broker_found_manual"
  | "landing_preview_shown"
  | "lead_form_started"
  | "lead_submitted"
  | "step_acknowledged"
  | "step_completed"
  | "playbook_session_completed"
  | "timeline_progress";

export type FastDealOutcomeType =
  | "broker_found"
  | "broker_contacted"
  | "lead_captured"
  | "lead_qualified"
  | "meeting_booked"
  | "deal_progressed"
  | "deal_closed";

export type FastDealSourceEvent = {
  id: string;
  sourceType: FastDealSourceType;
  sourceSubType: string;
  createdAt: string;
  createdBy?: string;
  metadata?: Record<string, unknown>;
};

export type FastDealOutcome = {
  id: string;
  sourceEventId?: string | null;
  leadId?: string | null;
  brokerId?: string | null;
  outcomeType: FastDealOutcomeType | string;
  createdAt: string;
  metadata?: Record<string, unknown>;
};

export type FastDealSourcingUsageRow = {
  platform: string;
  events: number;
  queryCopies: number;
  sessionsStarted: number;
};

export type FastDealLandingPerformanceRow = {
  marketVariant: string;
  previewShown: number;
  formStarted: number;
  submitted: number;
};

export type FastDealPlaybookProgressRow = {
  step: number;
  acknowledged: number;
  completed: number;
  /** Heuristic: acknowledged but not completed within logged events (weak signal). */
  possiblySkippedHints: number;
};

export type FastDealOutcomeBucket = {
  outcomeType: string;
  count: number;
};

export type FastDealSparseSummary = {
  level: "ok" | "low" | "very_low";
  /** Explicit operator-facing explanation. */
  message: string;
};

export type FastDealSummary = {
  sourcingUsage: FastDealSourcingUsageRow[];
  landingPerformance: FastDealLandingPerformanceRow[];
  playbookProgress: FastDealPlaybookProgressRow[];
  outcomes: FastDealOutcomeBucket[];
  insights: string[];
  sparse: FastDealSparseSummary;
  generatedAt: string;
};
