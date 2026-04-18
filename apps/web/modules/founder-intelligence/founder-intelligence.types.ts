import type { CompanyMetricsSnapshot } from "../company-metrics/company-metrics.types";
import type { CompanyMetricsWindow } from "../company-metrics/company-metrics.types";
import type { ExecutiveScope } from "../owner-access/owner-access.types";
import type { OwnerDashboardPayload } from "../owner-dashboard/owner-dashboard.types";

export type FounderSignalKind =
  | "metrics_delta"
  | "owner_priority"
  | "compliance"
  | "finance"
  | "pipeline"
  | "velocity"
  | "marketing"
  | "memory";

export type FounderSignal = {
  kind: FounderSignalKind;
  label: string;
  /** Machine-readable path or id for audit (e.g. `deals.active`) */
  ref: string;
  /** Factual value from internal aggregates when applicable */
  value?: string | number | null;
};

export type FounderIntelligenceSnapshot = {
  scope: ExecutiveScope;
  window: CompanyMetricsWindow;
  generatedAt: string;
  current: CompanyMetricsSnapshot;
  previous: CompanyMetricsSnapshot | null;
  previousRangeLabel: string | null;
  dashboard: OwnerDashboardPayload;
  signals: FounderSignal[];
  /** What changed vs prior window — short factual bullets */
  whatChanged: string[];
  /** Improving metrics — factual comparison only */
  improving: { metric: string; current: number | null; previous: number | null; note?: string }[];
  /** Deteriorating metrics — factual comparison only */
  deteriorating: { metric: string; current: number | null; previous: number | null; note?: string }[];
  /** Items that likely need a decision soon (from thresholds + backlog counts, not invented causes) */
  decisionNow: string[];
  /** Delegation candidates — factual workload / queue signals */
  delegateCandidates: string[];
  /** Forward look — scheduled or trend-based hints; may include labeled estimates */
  nextWeekWatchlist: string[];
};

export type FounderMemoryBrief = {
  recentDecisions: { id: string; title: string; createdAt: string }[];
  recentBriefingIds: string[];
};
