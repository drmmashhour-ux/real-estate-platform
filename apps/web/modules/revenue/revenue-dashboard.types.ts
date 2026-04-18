/**
 * Revenue Dashboard V1 — read-only operator visibility (no payment execution).
 */

export type RevenueSource = "lead_unlock" | "booking_fee" | "boost" | "subscription" | "other";

export type RevenueMetricCard = {
  label: string;
  value: number;
  formattedValue: string;
};

export type RevenueAlert = {
  id: string;
  level: "info" | "warning" | "critical";
  title: string;
  description: string;
  /** Higher = more urgent for operators (deterministic sort). */
  priorityScore?: number;
};

export type RevenueSourceBreakdownItem = {
  amount: number;
  eventCount: number;
  avgAmount: number | null;
};

/** BNHub / booking fee slice — read-only, from RevenueEvent booking_fee mapping. */
export type RevenueBnhubSummary = {
  weekBookingFeeRevenue: number;
  bookingFeeEventsWeek: number;
  avgBookingFee: number | null;
};

export type SparseDisplayState = {
  tier: "ok" | "sparse" | "empty";
  messages: string[];
};

export type OperatorChecklist = {
  todayFocus: string;
  topActions: string[];
};

export type RevenueDashboardSummary = {
  revenueToday: number;
  revenueWeek: number;
  revenueMonth: number;
  revenueBySource: Record<RevenueSource, number>;
  /** 7d positive-amount RevenueEvent rows (all sources). */
  weekPositiveRevenueEvents: number;
  revenueBySourceDetail: Record<RevenueSource, RevenueSourceBreakdownItem>;
  bnhub: RevenueBnhubSummary;
  leadsViewed: number;
  leadsUnlocked: number;
  leadUnlockRate: number;
  activeBrokers: number;
  /** Brokers with attributed positive revenue in the 30d payer window (same as generating revenue). */
  payingBrokers: number;
  brokersGeneratingRevenue: number;
  unlockedLeadsWeek: number;
  revenuePerBroker: number;
  avgRevenuePerActiveBroker7d: number;
  bookingStarts: number;
  bookingCompleted: number;
  bookingCompletionRate: number;
  alerts: RevenueAlert[];
  notes: string[];
  /** Env-backed daily goal (CAD) used for target strip. */
  dailyTargetCad: number;
  pctToDailyTarget: number | null;
  sparseDisplay: SparseDisplayState;
  operatorRecommendations: string[];
  operatorChecklist: OperatorChecklist;
  createdAt: string;
};
